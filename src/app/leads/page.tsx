import { PrismaClient } from "@prisma/client";
import { ImportLeadForm } from "@/components/ImportLeadForm";

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export default async function LeadsManager() {
    const leads = await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        Leads Manager
                    </h1>
                    <p className="text-slate-500 mt-2">View recently extracted leads and their pipeline status.</p>
                </div>
                <ImportLeadForm />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4 text-right">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    No leads found in the database.
                                </td>
                            </tr>
                        ) : leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {lead.name}
                                    <div className="text-xs text-slate-400 font-normal">{lead.title}</div>
                                </td>
                                <td className="px-6 py-4">{lead.company || "-"}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${lead.status === 'ENRICHED' || lead.status === 'SEQUENCED' ? 'bg-blue-100 text-blue-800' :
                                        lead.status === 'SENT' ? 'bg-green-100 text-green-800' :
                                            lead.status === 'REPLIED' ? 'bg-purple-100 text-purple-800' :
                                                lead.status === 'SUPPRESSED' ? 'bg-red-100 text-red-800' :
                                                    'bg-slate-100 text-slate-800'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{lead.score}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    {new Date(lead.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
