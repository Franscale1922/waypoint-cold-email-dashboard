import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const leads = Array.isArray(body) ? body : [body];

        const results = [];

        for (const leadData of leads) {
            // Validate required fields
            if (!leadData.name || !leadData.linkedinUrl) {
                results.push({ success: false, error: "Name and LinkedIn URL required", raw: leadData });
                continue;
            }

            try {
                // Upsert lead so we don't duplicate on same linkedin URL
                const lead = await prisma.lead.upsert({
                    where: { linkedinUrl: leadData.linkedinUrl },
                    update: {
                        title: leadData.title || undefined,
                        company: leadData.company || undefined,
                        country: leadData.country || undefined,
                        recentPostSummary: leadData.recentPostSummary || undefined,
                        pulledQuoteFromPost: leadData.pulledQuoteFromPost || undefined,
                        specificProjectOrMetric: leadData.specificProjectOrMetric || undefined,
                        placeOrPersonalDetail: leadData.placeOrPersonalDetail || undefined,
                        franchiseAngle: leadData.franchiseAngle || undefined,
                        careerTrigger: leadData.careerTrigger || undefined,
                    },
                    create: {
                        name: leadData.name,
                        linkedinUrl: leadData.linkedinUrl,
                        title: leadData.title || null,
                        company: leadData.company || null,
                        country: leadData.country || null,
                        recentPostSummary: leadData.recentPostSummary || null,
                        pulledQuoteFromPost: leadData.pulledQuoteFromPost || null,
                        specificProjectOrMetric: leadData.specificProjectOrMetric || null,
                        placeOrPersonalDetail: leadData.placeOrPersonalDetail || null,
                        franchiseAngle: leadData.franchiseAngle || null,
                        careerTrigger: leadData.careerTrigger || null,
                        status: "RAW"
                    }
                });

                // Fire Inngest event — wrapped separately so a dispatch failure
                // doesn't roll back the DB write
                if (lead.status === "RAW") {
                    try {
                        await inngest.send({
                            name: "workflow/lead.hunter.start",
                            data: { leadId: lead.id }
                        });
                    } catch (inngestErr: any) {
                        console.warn(`Inngest dispatch failed for lead ${lead.id}:`, inngestErr?.message);
                        // Lead is saved — Inngest can be retried manually
                    }
                }

                results.push({ success: true, id: lead.id });

            } catch (leadErr: any) {
                results.push({ success: false, error: leadErr.message, name: leadData.name });
            }
        }

        const imported = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return NextResponse.json({ processed: results.length, imported, failed, results }, { status: 200 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
