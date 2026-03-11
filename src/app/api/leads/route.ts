import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { inngest } from "@/inngest/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const leads = Array.isArray(body) ? body : [body];

        const results = [];

        for (const leadData of leads) {
            if (!leadData.name || !leadData.linkedinUrl) {
                results.push({ success: false, error: "Name and LinkedIn URL required", raw: leadData });
                continue;
            }

            // Upsert lead so we don't duplicate on same linkedin
            const lead = await prisma.lead.upsert({
                where: { linkedinUrl: leadData.linkedinUrl },
                update: {
                    title: leadData.title,
                    company: leadData.company,
                    country: leadData.country,
                    recentPostSummary: leadData.recentPostSummary,
                    pulledQuoteFromPost: leadData.pulledQuoteFromPost,
                    specificProjectOrMetric: leadData.specificProjectOrMetric,
                    placeOrPersonalDetail: leadData.placeOrPersonalDetail,
                    franchiseAngle: leadData.franchiseAngle,
                    careerTrigger: leadData.careerTrigger,
                },
                create: {
                    name: leadData.name,
                    linkedinUrl: leadData.linkedinUrl,
                    title: leadData.title,
                    company: leadData.company,
                    country: leadData.country,
                    recentPostSummary: leadData.recentPostSummary,
                    pulledQuoteFromPost: leadData.pulledQuoteFromPost,
                    specificProjectOrMetric: leadData.specificProjectOrMetric,
                    placeOrPersonalDetail: leadData.placeOrPersonalDetail,
                    franchiseAngle: leadData.franchiseAngle,
                    careerTrigger: leadData.careerTrigger,
                    status: "RAW"
                }
            });

            // trigger the main orchestration workflow for this lead if it hasn't been sequenced
            if (lead.status === "RAW") {
                await inngest.send({
                    name: "workflow/lead.hunter.start",
                    data: { leadId: lead.id }
                });
            }

            results.push({ success: true, id: lead.id });
        }

        return NextResponse.json({ processed: results.length, results }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
