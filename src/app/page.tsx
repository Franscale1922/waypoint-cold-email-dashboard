import { PrismaClient } from "@prisma/client";
import { Users, MailCheck, Inbox } from "lucide-react";

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export default async function DashboardOverview() {
  const [totalLeads, enriched, sent, replied, suppressed] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "ENRICHED" } }),
    prisma.lead.count({ where: { status: "SENT" } }),
    prisma.lead.count({ where: { status: "REPLIED" } }),
    prisma.lead.count({ where: { status: "SUPPRESSED" } }),
  ]);

  const metrics = [
    { name: "Total Leads", value: totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Emails Sent", value: sent, icon: MailCheck, color: "text-green-600", bg: "bg-green-100" },
    { name: "Replies Received", value: replied, icon: Inbox, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-2">Monitor your cold email pipeline performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((m) => (
          <div key={m.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 transition-all hover:shadow-md">
            <div className={`p-4 rounded-xl ${m.bg}`}>
              <m.icon className={`w-8 h-8 ${m.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{m.name}</p>
              <h3 className="text-3xl font-bold text-slate-800">{m.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Pipeline Funnel</h2>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">Enriched ({enriched})</span></div>
            <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Sent ({sent})</span></div>
            <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">Replied ({replied})</span></div>
            <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">Suppressed ({suppressed})</span></div>
          </div>
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
            <div style={{ width: `${(enriched / (totalLeads || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
            <div style={{ width: `${(sent / (totalLeads || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
            <div style={{ width: `${(replied / (totalLeads || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all duration-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
