"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Key } from "lucide-react";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        openAiApiKey: "",
        resendApiKey: "",
        maxSendsPerDay: "50"
    });

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                setFormData({
                    openAiApiKey: data.openAiApiKey || "",
                    resendApiKey: data.resendApiKey || "",
                    maxSendsPerDay: data.maxSendsPerDay?.toString() || "50"
                });
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) alert("Settings saved successfully!");
        } catch (err) {
            alert("Failed to save settings.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                    System Settings
                </h1>
                <p className="text-slate-500 mt-2">Manage your API keys and global delivery caps safely.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="w-4 h-4 text-slate-400" />
                            <label className="font-semibold text-slate-800">OpenAI API Key</label>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">Required for the Personalizer & Reply Guardian agents.</p>
                        <input
                            type="password"
                            className="w-full border border-slate-200 rounded-lg px-4 py-3 bg-slate-50 focus:bg-white text-slate-900 font-mono"
                            placeholder="sk-..."
                            value={formData.openAiApiKey}
                            onChange={e => setFormData({ ...formData, openAiApiKey: e.target.value })}
                        />
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="w-4 h-4 text-slate-400" />
                            <label className="font-semibold text-slate-800">Resend API Key</label>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">Required for the Sender agent to dispatch emails.</p>
                        <input
                            type="password"
                            className="w-full border border-slate-200 rounded-lg px-4 py-3 bg-slate-50 focus:bg-white text-slate-900 font-mono"
                            placeholder="re_..."
                            value={formData.resendApiKey}
                            onChange={e => setFormData({ ...formData, resendApiKey: e.target.value })}
                        />
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <label className="font-semibold text-slate-800 mb-2 block">Max Sends Per Day (Per Inbox)</label>
                        <p className="text-sm text-slate-500 mb-3">Caps the daily volume to protect domain reputation.</p>
                        <input
                            type="number"
                            className="w-32 border border-slate-200 rounded-lg px-4 py-3"
                            value={formData.maxSendsPerDay}
                            onChange={e => setFormData({ ...formData, maxSendsPerDay: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
