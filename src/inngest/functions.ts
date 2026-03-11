import { inngest } from "./client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const leadHunterProcess = inngest.createFunction(
    { id: "lead-hunter-process" },
    { event: "workflow/lead.hunter.start" },
    async ({ event, step }) => {
        const { leadId } = event.data;

        const lead = await step.run("load-lead", async () => {
            return prisma.lead.findUnique({ where: { id: leadId } });
        });

        if (!lead || lead.status !== "RAW") {
            return { status: "Skipped - Already Processed or Not Found" };
        }

        const { email, rawScore } = await step.run("enrich-and-score", async () => {
            // Mocking the Third-party verification (ZeroBounce/Hunter)
            // Score based on some of the extracted text length for the mock
            let fakeScore = 60;
            if (lead.careerTrigger) fakeScore += 20;
            if (lead.title && lead.title.toLowerCase().includes('vp')) fakeScore += 20;
            if (fakeScore > 100) fakeScore = 100;

            return {
                email: `${lead.name.replace(/\\s+/g, '.').toLowerCase()}@${lead.company?.toLowerCase().replace(/\\s+/g, '') || "fake.com"}`,
                rawScore: fakeScore
            };
        });

        if (rawScore < 70) {
            // Mark as Suppressed or skip
            await step.run("mark-suppressed-or-ignored", async () => {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: "SUPPRESSED", score: rawScore, email }
                });
            });
            return { status: "Skipped - Score too low", score: rawScore };
        }

        // Update to ENRICHED
        await step.run("update-to-enriched", async () => {
            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: "ENRICHED", score: rawScore, email }
            });
        });

        // Phase 3 trigger: Personalizer will pick up from here
        // Next step will be published event for Personalizer
        await step.sendEvent("trigger-personalizer", {
            name: "workflow/lead.personalize.start",
            data: { leadId: lead.id }
        });

        return { status: "Enriched", email, rawScore };
    }
);

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { PROHIBITED_PHRASES, EMAIL_TEMPLATES } from "@/lib/templates";

export const personalizerProcess = inngest.createFunction(
    { id: "personalizer-process" },
    { event: "workflow/lead.personalize.start" },
    async ({ event, step }) => {
        const { leadId } = event.data;

        const lead = await step.run("load-enriched-lead", async () => {
            return prisma.lead.findUnique({ where: { id: leadId } });
        });

        if (!lead || lead.status !== "ENRICHED") {
            return { status: "Skipped - Not Enriched or Not Found" };
        }

        const { draftEmail } = await step.run("generate-personalized-email", async () => {
            const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
            const apiKey = settings?.openAiApiKey || process.env.OPENAI_API_KEY;

            if (!apiKey) throw new Error("Missing OpenAI API Key in Settings");

            // System prompt mimicking the exact requirements
            const systemPrompt = `You are the Waypoint Franchise Advisors "Personalizer Agent".
Your goal is to write a highly personalized, human-feeling cold email to a corporate professional.

CORE RULES:
1. Email length: 60-110 words, 1-3 short paragraphs.
2. Context slots: You must fill at least TWO context slots based on the provided lead data (e.g. pulled quote, post topic, project, place, franchise angle).
3. Do NOT use generic templates; synthesize the example templates with the specific context for the lead.
4. Tone: Colleague-level respect, conversational but professional, sometimes ask questions, clear out any "AI smell".
5. Structure:
   - Concrete opener (referencing post/trigger).
   - One micro-story or comparison connecting their situation to someone you helped.
   - Soft calendar invite with an "easy out" constraint.
   - One short question about their situation.

PROHIBITED PHRASES:
${PROHIBITED_PHRASES.join(", ")}
AND NO em dashes (—). AND NO starting three sentences in a row with "I" or "Most".

Choose the closest template to start with, and modify heavily for the user:
${EMAIL_TEMPLATES}
`;

            // Pass the scraped details to the model
            const userPrompt = `Prospect Details:
Name: ${lead.name}
Title: ${lead.title || 'Executive'}
Company: ${lead.company || 'Corporate'}
Career Trigger: ${lead.careerTrigger || ''}
Recent Post Summary: ${lead.recentPostSummary || ''}
Pulled Quote from Post: ${lead.pulledQuoteFromPost || ''}
Specific Project/Metric: ${lead.specificProjectOrMetric || ''}
Place/Personal Detail: ${lead.placeOrPersonalDetail || ''}
Franchise Angle: ${lead.franchiseAngle || ''}

Write the email using plain text. Do NOT wrap it in quotes or markdown.`;

            const { text } = await generateText({
                model: openai("gpt-4o"),
                system: systemPrompt,
                prompt: userPrompt,
            });

            return { draftEmail: text };
        });

        // Save to DB and update status
        await step.run("save-draft-email", async () => {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    draftEmail,
                    status: "SEQUENCED"
                }
            });
        });

        return { status: "Personalized", leadId: lead.id };
    }
);

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "fallback_for_build");

export const senderProcess = inngest.createFunction(
    { id: "sender-process" },
    { event: "workflow/lead.send.start" },
    async ({ event, step }) => {
        const { leadId } = event.data;

        const lead = await step.run("load-sequenced-lead", async () => {
            return prisma.lead.findUnique({ where: { id: leadId } });
        });

        if (!lead || lead.status !== "SEQUENCED" || !lead.draftEmail || !lead.email) {
            return { status: "Skipped - Not Sequenced, Missing Draft, or Missing Target Email" };
        }

        // Mock checking warmup caps / interval randomness
        await step.sleep("random-interval-delay", `${Math.floor(Math.random() * 5) + 3}m`); // 3-8 minute random interval target

        // Send via Resend
        const sendResult = await step.run("send-via-resend", async () => {
            try {
                const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
                const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
                if (!apiKey) throw new Error("Missing Resend API Key in Settings");

                const client = new Resend(apiKey);

                const { data, error } = await client.emails.send({
                    from: "Jake <jake@waypointfranchising.com>", // To be parameterized
                    to: [lead.email!],
                    subject: "Exploring franchise paths", // To be generated or A/B tested
                    // @ts-ignore - draftEmail is added in the updated Prisma client but TS language server may be cached
                    text: lead.draftEmail!,
                    headers: {
                        "List-Unsubscribe": "<mailto:unsubscribe@waypointfranchising.com>"
                    }
                });

                if (error) throw new Error(error.message);
                return { success: true, resendId: data?.id ?? null, error: null };
            } catch (err: any) {
                return { success: false, resendId: null, error: err.message };
            }
        });

        if (!sendResult.success) {
            // Handle failure scenario, possibly marking as SUPPRESSED or retrying
            return { status: "Failed", error: sendResult.error };
        }

        // Update DB
        await step.run("mark-as-sent", async () => {
            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: "SENT" }
            });
        });

        return { status: "Sent", resendId: sendResult.resendId };
    }
);

export const replyGuardianProcess = inngest.createFunction(
    { id: "reply-guardian-process" },
    { event: "workflow/lead.reply.received" },
    async ({ event, step }) => {
        const { replyId, leadId } = event.data;

        const replyData = await step.run("load-reply-and-lead", async () => {
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
            const reply = await prisma.reply.findUnique({ where: { id: replyId } });
            return { lead, reply };
        });

        if (!replyData.lead || !replyData.reply) {
            return { status: "Skipped - Missing DB records" };
        }

        const { classification } = await step.run("classify-reply", async () => {
            const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
            const apiKey = settings?.openAiApiKey || process.env.OPENAI_API_KEY;

            const systemPrompt = `You are an expert sales reply classifier.
Classify the following email reply into exactly one of these categories:
"Interested", "Curious", "Not now", "Not a fit", "Unsubscribe", "Out of office", "Ambiguous".
Output ONLY the category name.`;

            if (!apiKey) return { classification: "Unclassified (Missing API Key)" };
            const { createOpenAI } = require('@ai-sdk/openai');
            const customOpenai = createOpenAI({ apiKey });

            const { text } = await generateText({
                model: customOpenai("gpt-4o"),
                system: systemPrompt,
                prompt: replyData.reply?.content || ""
            });

            return { classification: text.trim() };
        });

        await step.run("update-reply-and-lead", async () => {
            await prisma.reply.update({
                where: { id: replyId },
                data: { classification }
            });

            // Update Lead status based on reply
            // @ts-ignore
            let newStatus = "REPLIED";
            if (classification === "Unsubscribe" || classification === "Not a fit") {
                newStatus = "SUPPRESSED";
            }

            await prisma.lead.update({
                where: { id: leadId },
                // @ts-ignore
                data: { status: newStatus as any }
            });
        });

        // Slack/Gmail integration mock
        await step.run("notify-human", async () => {
            if (["Interested", "Curious", "Ambiguous"].includes(classification)) {
                // e.g. await fetch("slack-webhook-url", { ... })
                console.log(`[ALERT] High intent reply from ${replyData.lead?.name}! Classification: ${classification}`);
            }
        });

        return { status: "Processed", classification };
    }
);

export const monitorProcess = inngest.createFunction(
    { id: "monitor-process" },
    { cron: "0 9 * * *" }, // Run every day at 9 AM
    async ({ step }) => {
        const stats = await step.run("fetch-resend-stats", async () => {
            // Mocking fetching domain reputation and bounce stats
            // e.g. await resend.domains.get("waypointfranchising.com")
            return {
                bounceRate: Math.random() * 5, // mock 0-5%
                complaintRate: Math.random() * 0.5, // mock 0-0.5%
            };
        });

        await step.run("evaluate-health", async () => {
            if (stats.bounceRate > 2.0 || stats.complaintRate >= 0.3) {
                // Alert Slack / Pause Sending
                console.error(`[CRITICAL] Domain health failing! Bounce: ${stats.bounceRate.toFixed(1)}%, Complaints: ${stats.complaintRate.toFixed(2)}%`);
                // Here we could update a Global Settings DB to pause the "senderProcess"
            } else {
                console.log(`[OK] Domain health stable. Bounce: ${stats.bounceRate.toFixed(1)}%`);
            }
        });

        return { status: "Monitored", stats };
    }
);
