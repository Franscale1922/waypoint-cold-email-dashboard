"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImportLeadForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        linkedinUrl: "",
        title: "",
        company: "",
        careerTrigger: "",
        recentPostSummary: "",
        pulledQuoteFromPost: "",
        franchiseAngle: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([formData])
            });
            if (res.ok) {
                setIsOpen(false);
                setFormData({ name: "", linkedinUrl: "", title: "", company: "", careerTrigger: "", recentPostSummary: "", pulledQuoteFromPost: "", franchiseAngle: "" });
                router.refresh();
            } else {
                alert("Failed to import lead.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
                <PlusCircle className="w-4 h-4" />
                Import Lead
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">×</button>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Manually Import Lead</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL <span className="text-red-500">*</span></label>
                                    <input required type="url" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                </div>
                            </div>

                            <hr className="border-slate-100 my-4" />
                            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Context Signals</p>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Career Trigger</label>
                                <input placeholder="e.g. Laid off, Stepped down as VP" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.careerTrigger} onChange={e => setFormData({ ...formData, careerTrigger: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Recent Post Summary</label>
                                <input placeholder="e.g. Talked about corporate burnout" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.recentPostSummary} onChange={e => setFormData({ ...formData, recentPostSummary: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pulled Quote from Post</label>
                                <input placeholder="e.g. 'I realized the ladder leads nowhere'" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.pulledQuoteFromPost} onChange={e => setFormData({ ...formData, pulledQuoteFromPost: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Franchise Angle</label>
                                <input placeholder="e.g. Wants stability and equity" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.franchiseAngle} onChange={e => setFormData({ ...formData, franchiseAngle: e.target.value })} />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save & Trigger AI
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
