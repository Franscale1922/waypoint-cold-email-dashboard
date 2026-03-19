import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { inngest } from "@/inngest/client";

const prisma = new PrismaClient();

// ── GET: return all leads (for sortable table) ────────────────────────────────
export async function GET() {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                title: true,
                company: true,
                status: true,
                score: true,
                email: true,
                createdAt: true,
            },
        });
        return NextResponse.json(leads);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST: upsert leads + fire Inngest events ──────────────────────────────────
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
                        companyNewsEvent: leadData.companyNewsEvent || undefined,
                        recentPostSummary: leadData.recentPostSummary || undefined,
                        careerTrigger: leadData.careerTrigger || undefined,
                        franchiseAngle: leadData.franchiseAngle || undefined,
                        pulledQuoteFromPost: leadData.pulledQuoteFromPost || undefined,
                        specificProjectOrMetric: leadData.specificProjectOrMetric || undefined,
                        placeOrPersonalDetail: leadData.placeOrPersonalDetail || undefined,
                    },
                    create: {
                        name: leadData.name,
                        linkedinUrl: leadData.linkedinUrl,
                        title: leadData.title || null,
                        company: leadData.company || null,
                        country: leadData.country || null,
                        companyNewsEvent: leadData.companyNewsEvent || null,
                        recentPostSummary: leadData.recentPostSummary || null,
                        careerTrigger: leadData.careerTrigger || null,
                        franchiseAngle: leadData.franchiseAngle || null,
                        pulledQuoteFromPost: leadData.pulledQuoteFromPost || null,
                        specificProjectOrMetric: leadData.specificProjectOrMetric || null,
                        placeOrPersonalDetail: leadData.placeOrPersonalDetail || null,
                        status: "RAW"
                    }
                });

                // Fire Inngest event — wrapped separately so dispatch failure
                // doesn't roll back the DB write
                if (lead.status === "RAW") {
                    try {
                        await inngest.send({
                            name: "workflow/lead.hunter.start",
                            data: { leadId: lead.id }
                        });
                    } catch (inngestErr: unknown) {
                        const msg = inngestErr instanceof Error ? inngestErr.message : "Unknown";
                        console.warn(`Inngest dispatch failed for lead ${lead.id}:`, msg);
                        // Lead is saved — Inngest can be retried manually
                    }
                }

                results.push({ success: true, id: lead.id });

            } catch (leadErr: unknown) {
                const msg = leadErr instanceof Error ? leadErr.message : "Unknown";
                results.push({ success: false, error: msg, name: leadData.name });
            }
        }

        const imported = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return NextResponse.json({ processed: results.length, imported, failed, results }, { status: 200 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
