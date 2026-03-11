import { PrismaClient } from "@prisma/client";
import { MessageSquareReply, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export default async function InboxManager() {
    const replies = await prisma.reply.findMany({
        include: { lead: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                    Inbox & Replies
                </h1>
                <p className="text-slate-500 mt-2">Review AI-classified inbound emails and flagged conversations.</p>
            </div>

            <div className="grid gap-4">
                {replies.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-slate-200 text-slate-400">
                        No replies received yet.
                    </div>
                ) : replies.map((reply) => {
                    let badgeColor = "bg-slate-100 text-slate-700";
                    let Icon = MessageSquareReply;

                    if (reply.classification === "Interested" || reply.classification === "Curious") {
                        badgeColor = "bg-green-100 text-green-700 font-bold border border-green-200";
                        Icon = CheckCircle2;
                    } else if (reply.classification === "Ambiguous" || reply.classification === "Complex") {
                        badgeColor = "bg-orange-100 text-orange-700 font-bold border border-orange-200";
                        Icon = AlertTriangle;
                    }

                    return (
                        <div key={reply.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 block transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${badgeColor.replace(/text-.*|font-.+|border-.*/g, '')}`}>
                                        <Icon className={`w-5 h-5 ${badgeColor.match(/text-[a-z]+-[0-9]+/)?.[0]}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{reply.lead.name}</h3>
                                        <p className="text-xs text-slate-500">{reply.lead.title} at {reply.lead.company}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs text-slate-400">
                                        {new Date(reply.createdAt).toLocaleString()}
                                    </span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${badgeColor}`}>
                                        {reply.classification || "Unclassified"}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans">
                                {reply.content}
                            </div>
                        </div>
                    );
                })}
            </div >
        </div >
    );
}
