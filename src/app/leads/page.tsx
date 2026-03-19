"use client";

import { useEffect, useState, useCallback } from "react";
import { ImportLeadForm } from "@/components/ImportLeadForm";

type LeadStatus = "RAW" | "ENRICHED" | "SEQUENCED" | "SENT" | "REPLIED" | "BOOKED" | "SUPPRESSED";

interface Lead {
    id: string;
    name: string;
    title: string | null;
    company: string | null;
    status: LeadStatus;
    score: number;
    email: string | null;
    createdAt: string;
}

type SortKey = "name" | "company" | "status" | "score" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<LeadStatus, string> = {
    RAW: "bg-slate-100 text-slate-700",
    ENRICHED: "bg-blue-100 text-blue-800",
    SEQUENCED: "bg-indigo-100 text-indigo-800",
    SENT: "bg-green-100 text-green-800",
    REPLIED: "bg-purple-100 text-purple-800",
    BOOKED: "bg-emerald-100 text-emerald-800",
    SUPPRESSED: "bg-red-100 text-red-700",
};

const ALL_STATUSES: LeadStatus[] = ["RAW", "ENRICHED", "SEQUENCED", "SENT", "REPLIED", "BOOKED", "SUPPRESSED"];

export default function LeadsManager() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");

    const fetchLeads = useCallback(async () => {
        try {
            const res = await fetch("/api/leads");
            if (!res.ok) throw new Error("Failed to fetch");
            const data: Lead[] = await res.json();
            setLeads(data);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Failed to load leads:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
        // Auto-refresh every 30s so status updates appear without reload
        const interval = setInterval(fetchLeads, 30_000);
        return () => clearInterval(interval);
    }, [fetchLeads]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortIcon = (key: SortKey) => {
        if (sortKey !== key) return <span className="ml-1 opacity-30">↕</span>;
        return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const filtered = leads.filter(l => statusFilter === "ALL" || l.status === statusFilter);

    const sorted = [...filtered].sort((a, b) => {
        let aVal: string | number = a[sortKey] ?? "";
        let bVal: string | number = b[sortKey] ?? "";
        if (sortKey === "score") {
            aVal = Number(aVal);
            bVal = Number(bVal);
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
    });

    // Status counts for pills
    const counts = leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const thClass = "px-6 py-4 cursor-pointer select-none hover:text-slate-900 transition-colors whitespace-nowrap";

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        Leads Manager
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {leads.length} total leads
                        {lastRefreshed && (
                            <span className="ml-2 text-xs text-slate-400">
                                · refreshed {lastRefreshed.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLeads}
                        className="text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
                    >
                        ↻ Refresh
                    </button>
                    <ImportLeadForm />
                </div>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        statusFilter === "ALL"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                >
                    All ({leads.length})
                </button>
                {ALL_STATUSES.filter(s => (counts[s] || 0) > 0).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            statusFilter === s
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                    >
                        {s} ({counts[s] || 0})
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="px-6 py-16 text-center text-slate-400 text-sm">Loading leads…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className={thClass} onClick={() => handleSort("name")}>
                                        Name {sortIcon("name")}
                                    </th>
                                    <th className={thClass} onClick={() => handleSort("company")}>
                                        Company {sortIcon("company")}
                                    </th>
                                    <th className={thClass} onClick={() => handleSort("status")}>
                                        Status {sortIcon("status")}
                                    </th>
                                    <th className={thClass} onClick={() => handleSort("score")}>
                                        Score {sortIcon("score")}
                                    </th>
                                    <th className={`${thClass} text-right`} onClick={() => handleSort("createdAt")}>
                                        Added {sortIcon("createdAt")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sorted.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                            No leads match this filter.
                                        </td>
                                    </tr>
                                ) : sorted.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {lead.name}
                                            {lead.title && (
                                                <div className="text-xs text-slate-400 font-normal">{lead.title}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{lead.company || "—"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status]}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-mono text-sm ${lead.score >= 70 ? "text-green-700 font-semibold" : lead.score > 0 ? "text-slate-700" : "text-slate-400"}`}>
                                                {lead.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap text-slate-400 text-xs">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {sorted.length > 0 && filtered.length !== leads.length && (
                <p className="text-xs text-slate-400 text-center">
                    Showing {sorted.length} of {leads.length} leads
                </p>
            )}
        </div>
    );
}
