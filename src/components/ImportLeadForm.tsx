"use client";

import { useState, useRef } from "react";
import { PlusCircle, Loader2, Upload, CheckCircle, AlertCircle, X, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types -------------------------------------------------------------------
type LeadRow = {
      name: string;
      linkedinUrl: string;
      title: string;
      company: string;
      careerTrigger: string;
      recentPostSummary: string;
      pulledQuoteFromPost: string;
      franchiseAngle: string;
};

type ParseResult = {
      valid: LeadRow[];
      skipped: number;
};

// --- CSV Parser (no external deps) -------------------------------------------
function parseCSV(text: string): ParseResult {
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return { valid: [], skipped: 0 };

  // Normalise header: lowercase, strip spaces/underscores/hyphens
  const headers = lines[0].split(",").map(h =>
          h.trim().toLowerCase().replace(/[\s_\-]/g, "")
                                            );

  const map: Record<string, string> = {
          name:                 "name",
          fullname:             "name",
          firstname:            "name",        // best-effort
          linkedinurl:          "linkedinUrl",
          linkedin:             "linkedinUrl",
          profileurl:           "linkedinUrl",
          url:                  "linkedinUrl",
          title:                "title",
          jobtitle:             "title",
          position:             "title",
          company:              "company",
          companyname:          "company",
          organization:         "company",
          careertrigger:        "careerTrigger",
          trigger:              "careerTrigger",
          recentpostsummary:    "recentPostSummary",
          postsummary:          "recentPostSummary",
          post:                 "recentPostSummary",
          pulledquotefrompost:  "pulledQuoteFromPost",
          quote:                "pulledQuoteFromPost",
          pulledquote:          "pulledQuoteFromPost",
          franchiseangle:       "franchiseAngle",
          angle:                "franchiseAngle",
  };

  const valid: LeadRow[] = [];
      let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
          // Respects quoted fields with commas inside
        const cols = lines[i].match(/(".*?"|[^",]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? lines[i].split(",");
          const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());

        const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
                    const field = map[h];
                    if (field) row[field] = clean[idx] ?? "";
          });

        if (!row.name || !row.linkedinUrl) { skipped++; continue; }

        valid.push({
                  name:                row.name             ?? "",
                  linkedinUrl:         row.linkedinUrl       ?? "",
                  title:               row.title             ?? "",
                  company:             row.company           ?? "",
                  careerTrigger:       row.careerTrigger     ?? "",
                  recentPostSummary:   row.recentPostSummary ?? "",
                  pulledQuoteFromPost: row.pulledQuoteFromPost ?? "",
                  franchiseAngle:      row.franchiseAngle    ?? "",
        });
  }

  return { valid, skipped };
}

// --- Main Component ----------------------------------------------------------
export function ImportLeadForm() {
      const router = useRouter();
      const fileRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen]     = useState(false);
      const [tab, setTab]           = useState<"manual" | "csv">("manual");
      const [isLoading, setIsLoading] = useState(false);

  // Manual form state
  const [formData, setFormData] = useState<LeadRow>({
          name: "", linkedinUrl: "", title: "", company: "",
          careerTrigger: "", recentPostSummary: "", pulledQuoteFromPost: "", franchiseAngle: ""
  });

  // CSV state
  const [csvFile, setCsvFile]       = useState<File | null>(null);
      const [preview, setPreview]       = useState<LeadRow[]>([]);
      const [skipped, setSkipped]       = useState(0);
      const [uploadResult, setUploadResult] = useState<{ imported: number; errors: number } | null>(null);
      const [dragOver, setDragOver]     = useState(false);

  // --- Helpers ---------------------------------------------------------------
  const closeModal = () => {
          setIsOpen(false);
          setTab("manual");
          setCsvFile(null);
          setPreview([]);
          setSkipped(0);
          setUploadResult(null);
          setFormData({ name: "", linkedinUrl: "", title: "", company: "", careerTrigger: "", recentPostSummary: "", pulledQuoteFromPost: "", franchiseAngle: "" });
  };

  const processFile = (file: File) => {
          setCsvFile(file);
          setUploadResult(null);
          const reader = new FileReader();
          reader.onload = (e) => {
                    const text = e.target?.result as string;
                    const { valid, skipped: sk } = parseCSV(text);
                    setPreview(valid);
                    setSkipped(sk);
          };
          reader.readAsText(file);
  };

  // --- Manual submit ---------------------------------------------------------
  const handleManualSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsLoading(true);
          try {
                    const res = await fetch("/api/leads", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify([formData]),
                    });
                    if (res.ok) {
                                closeModal();
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

  // --- CSV submit ------------------------------------------------------------
  const handleCSVSubmit = async () => {
          if (!preview.length) return;
          setIsLoading(true);

          // Send in batches of 25
          const BATCH = 25;
          let imported = 0;
          let errors = 0;

          for (let i = 0; i < preview.length; i += BATCH) {
                    const batch = preview.slice(i, i + BATCH);
                    try {
                                const res = await fetch("/api/leads", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify(batch),
                                });
                                if (res.ok) {
                                              const data = await res.json();
                                              imported += Array.isArray(data) ? data.length : batch.length;
                                } else {
                                              errors += batch.length;
                                }
                    } catch {
                                errors += batch.length;
                    }
          }

          setUploadResult({ imported, errors });
          setIsLoading(false);
          if (errors === 0) {
                    setTimeout(() => { closeModal(); router.refresh(); }, 1800);
          }
  };

  // --- Drag-and-drop ---------------------------------------------------------
  const onDrop = (e: React.DragEvent) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file?.name.endsWith(".csv")) processFile(file);
  };

  // --- Render ----------------------------------------------------------------
  return (
          <>
              {/* Trigger buttons */}
                <div className="flex gap-2">
                        <button
                                      onClick={() => { setTab("csv"); setIsOpen(true); }}
                                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                                    >
                                  <Upload className="w-4 h-4" />
                                  Bulk Upload CSV
                        </button>button>
                        <button
                                      onClick={() => { setTab("manual"); setIsOpen(true); }}
                                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                                    >
                                  <PlusCircle className="w-4 h-4" />
                                  Import Lead
                        </button>button>
                </div>div>
          
              {/* Modal */}
              {isOpen && (
                      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                                    {/* Header */}
                                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                                                          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                                                          <button
                                                                                                onClick={() => setTab("manual")}
                                                                                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "manual" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                                                                                              >
                                                                                            Manual Entry
                                                                          </button>button>
                                                                          <button
                                                                                                onClick={() => setTab("csv")}
                                                                                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "csv" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                                                                                              >
                                                                                            Bulk CSV Upload
                                                                          </button>button>
                                                          </div>div>
                                                          <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                                                                          <X className="w-5 h-5" />
                                                          </button>button>
                                            </div>div>
                                
                                            <div className="p-6">
                                                {/* --- MANUAL TAB --- */}
                                                {tab === "manual" && (
                                          <form onSubmit={handleManualSubmit} className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                                      <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span>span></label>label>
                                                                                                      <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                                                                    </div>div>
                                                                                <div>
                                                                                                      <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL <span className="text-red-500">*</span>span></label>label>
                                                                                                      <input required type="url" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} />
                                                                                    </div>div>
                                                            </div>div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                                      <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>label>
                                                                                                      <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                                                                    </div>div>
                                                                                <div>
                                                                                                      <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>label>
                                                                                                      <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                                                                    </div>div>
                                                            </div>div>
                                                            <hr className="border-slate-100" />
                                                            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Context Signals</p>p>
                                                            <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Career Trigger</label>label>
                                                                                <input placeholder="e.g. Laid off, Stepped down as VP" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.careerTrigger} onChange={e => setFormData({ ...formData, careerTrigger: e.target.value })} />
                                                            </div>div>
                                                            <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Recent Post Summary</label>label>
                                                                                <input placeholder="e.g. Talked about corporate burnout" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.recentPostSummary} onChange={e => setFormData({ ...formData, recentPostSummary: e.target.value })} />
                                                            </div>div>
                                                            <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Pulled Quote from Post</label>label>
                                                                                <input placeholder="e.g. 'I realized the ladder leads nowhere'" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.pulledQuoteFromPost} onChange={e => setFormData({ ...formData, pulledQuoteFromPost: e.target.value })} />
                                                            </div>div>
                                                            <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Franchise Angle</label>label>
                                                                                <input placeholder="e.g. Wants stability and equity" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.franchiseAngle} onChange={e => setFormData({ ...formData, franchiseAngle: e.target.value })} />
                                                            </div>div>
                                                            <div className="pt-2 flex justify-end gap-3">
                                                                                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>button>
                                                                                <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                                                                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                                                                      Save & Trigger AI
                                                                                    </button>button>
                                                            </div>div>
                                          </form>form>
                                                          )}
                                            
                                                {/* --- CSV TAB --- */}
                                                {tab === "csv" && (
                                          <div className="space-y-5">
                                              {/* Drop zone */}
                                              {!csvFile && (
                                                                  <div
                                                                                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                                                                            onDragLeave={() => setDragOver(false)}
                                                                                            onDrop={onDrop}
                                                                                            onClick={() => fileRef.current?.click()}
                                                                                            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}`}
                                                                                          >
                                                                                        <Upload className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                                                                        <p className="text-sm font-medium text-slate-700">Drop your CSV here or <span className="text-emerald-600 underline">browse</span>span></p>p>
                                                                                        <p className="text-xs text-slate-400 mt-1">Accepts .csv files exported from Apollo, Sales Navigator, Clay, or any tool</p>p>
                                                                                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
                                                                  </div>div>
                                                            )}
                                          
                                              {/* Column mapping tip */}
                                              {!csvFile && (
                                                                  <div className="bg-slate-50 rounded-xl p-4">
                                                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supported Column Names</p>p>
                                                                                        <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                                                                                                                <span><span className="font-mono bg-white px-1 rounded">name</span>span> or <span className="font-mono bg-white px-1 rounded">full name</span>span></span>span>
                                                                                                                <span><span className="font-mono bg-white px-1 rounded">linkedin_url</span>span> or <span className="font-mono bg-white px-1 rounded">profile url</span>span></span>span>
                                                                                                                <span><span className="font-mono bg-white px-1 rounded">title</span>span> or <span className="font-mono bg-white px-1 rounded">job title</span>span></span>span>
                                                                                                                <span><span className="font-mono bg-white px-1 rounded">company</span>span> or <span className="font-mono bg-white px-1 rounded">company name</span>span></span>span>
                                                                                                                <span><span className="font-mono bg-white px-1 rounded">career_trigger</span>span> <span className="text-slate-400">(optional)</span>span></span>span>
                                                                                                                <span><span className="font-mono bg-white px-1 rounded">franchise_angle</span>span> <span className="text-slate-400">(optional)</span>span></span>span>
                                                                                            </div>div>
                                                                  </div>div>
                                                            )}
                                          
                                              {/* File loaded -- show preview */}
                                              {csvFile && !uploadResult && (
                                                                  <>
                                                                                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                                                                                                <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                                          <p className="text-sm font-medium text-slate-800 truncate">{csvFile.name}</p>p>
                                                                                                                                          <p className="text-xs text-slate-500">{preview.length} valid lead{preview.length !== 1 ? "s" : ""} parsed{skipped > 0 ? \` . \${skipped} row\${skipped !== 1 ? "s" : ""} skipped (missing name/URL)\` : ""}</p>
                                                                                                                                                                  </div>
                                                                                                                                                                                          <button onClick={() => { setCsvFile(null); setPreview([]); setSkipped(0); }} className="text-slate-400 hover:text-slate-600">
                                                                                                                                                                                                                    <X className="w-4 h-4" />
                                                                                                                                                                                                                                            </button>
                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                        {preview.length > 0 && (
                                                                                                                                                                                                                                                                                                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                                                                                                                                                                                                                                                                                                                          <div className="overflow-x-auto max-h-48">
                                                                                                                                                                                                                                                                                                                                                                      <table className="w-full text-xs text-left">
                                                                                                                                                                                                                                                                                                                                                                                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                                                                                                                                                                                                                                                                                                                                                                                                                    <tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <th className="px-3 py-2">Name</th>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <th className="px-3 py-2">Company</th>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <th className="px-3 py-2">Title</th>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <th className="px-3 py-2">LinkedIn URL</th>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </thead>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <tbody className="divide-y divide-slate-100">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        {preview.slice(0, 8).map((row, i) => (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <tr key={i} className="hover:bg-slate-50">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <td className="px-3 py-2 text-slate-600">{row.company || "--"}</td>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <td className="px-3 py-2 text-slate-600">{row.title || "--"}</td>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <td className="px-3 py-2 text-slate-400 truncate max-w-[160px]">{row.linkedinUrl}</td>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ))}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            {preview.length > 8 && (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <td colSpan={4} className="px-3 py-2 text-center text-slate-400">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        + {preview.length - 8} more rows
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </td>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </tbody>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </table>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <div className="flex justify-end gap-3 pt-1">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <button
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                onClick={handleCSVSubmit}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          disabled={isLoading || preview.length === 0}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                {isLoading ? "Uploading..." : \`Upload \${preview.length} Leads\`}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      {/* Result */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        {uploadResult && (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <div className={`rounded-xl p-5 text-center \${uploadResult.errors === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                                                                                                                                              {uploadResult.errors === 0 ? (
                                                                                              <>
                                                                                                                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                                                                                                        <p className="font-semibold text-slate-800">{uploadResult.imported} leads imported successfully</p>p>
                                                                                                                        <p className="text-sm text-slate-500 mt-1">AI scoring + enrichment triggered for each lead</p>p>
                                                                                                  </>>
                                                                                            ) : (
                                                                                              <>
                                                                                                                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                                                                                                        <p className="font-semibold text-slate-800">{uploadResult.imported} imported . {uploadResult.errors} failed</p>p>
                                                                                                                        <p className="text-sm text-slate-500 mt-1">Partial import completed. Check the leads table.</p>p>
                                                                                                                        <button onClick={closeModal} className="mt-3 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">Close</button>button>
                                                                                                  </>>
                                                                                            )}
                                                                                                                                              </p>div>
                                                                                                                                  )}
                                                                                                                    </div>div>
                                                                                                      )}
                                                                                            </div>div>
                                                                  </>div>
                                              </div>
                                                    );
                                                  }
                                              </></></></>
