import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This endpoint receives incoming email webhooks from Resend/Instantly
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Depending on Resend's exact webhook payload shape
        // Assuming standard email parsed payload structure for demonstration
        const { from, subject, text, to } = body;

        // Find lead by email
        const emailStr = typeof from === 'string' ? from : from?.address;
        if (!emailStr) {
            return NextResponse.json({ success: false, reason: "No sender email found" }, { status: 400 });
        }

        const lead = await prisma.lead.findFirst({
            where: { email: { contains: emailStr } },
            orderBy: { updatedAt: 'desc' }
        });

        if (!lead) {
            return NextResponse.json({ success: true, message: "Unrecognized lead, ignored" }, { status: 200 });
        }

        // Save reply to DB
        const reply = await prisma.reply.create({
            data: {
                leadId: lead.id,
                content: text || "(No text content)"
            }
        });

        // Trigger Reply Guardian via Inngest
        await inngest.send({
            name: "workflow/lead.reply.received",
            data: { replyId: reply.id, leadId: lead.id }
        });

        return NextResponse.json({ success: true, replyId: reply.id }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
