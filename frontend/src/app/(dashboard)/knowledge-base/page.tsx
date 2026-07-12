"use client";

import { useState, useRef } from "react";
import { Library, Upload, Search, FileText, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  pages: number;
  status: string;
  date: string;
}

const initialDocuments: Document[] = [
  { id: 1, name: "Supplier Report Q4 2024", type: "PDF", size: "2.4 MB", pages: 12, status: "processed", date: "2024-12-15" },
  { id: 2, name: "Procurement SOP", type: "PDF", size: "1.8 MB", pages: 8, status: "processed", date: "2024-12-10" },
  { id: 3, name: "Contract Guidelines", type: "DOCX", size: "856 KB", pages: 6, status: "processed", date: "2024-12-08" },
  { id: 4, name: "Supplier Evaluation Report", type: "TXT", size: "12 KB", pages: 1, status: "processed", date: "2024-12-05" },
  { id: 5, name: "Annual Procurement Plan", type: "PDF", size: "5.2 MB", pages: 24, status: "processing", date: "2024-12-03" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getExtension(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase() || "TXT";
  return ext === "DOCX" || ext === "DOC" ? "DOCX" : ext === "PDF" ? "PDF" : "TXT";
}

const SAMPLE_CONTENTS: Record<string, string> = {
  "Supplier Report Q4 2024": `SUPPLIER PERFORMANCE REPORT - Q4 2024\n=====================================\n\nExecutive Summary:\n- Total active suppliers: 48\n- Average on-time delivery rate: 87.3%\n- Total procurement value: Rp 45.2 Miliar\n\nTop Performing Suppliers:\n1. PT Surya Pratama - Delivery: 95%, Quality: 92%\n2. PT Karya Mandiri - Delivery: 93%, Quality: 94%\n3. PT Nusantara Supply - Delivery: 96%, Quality: 91%\n\nRisk Assessment:\n- 3 suppliers flagged as high-risk\n- 7 suppliers under monitoring\n- 38 suppliers in good standing\n\nRecommendations:\n- Renegotiate contracts with underperforming logistics suppliers\n- Diversify raw material sourcing to reduce dependency\n- Implement quarterly review cycles for all Tier-1 suppliers`,
  "Procurement SOP": `STANDARD OPERATING PROCEDURE - PROCUREMENT\n===========================================\n\nDocument No: SOP-PROC-2024-001\nVersion: 3.0\nEffective Date: January 2024\n\n1. PURPOSE\n   To establish standard procedures for procurement of goods and services.\n\n2. SCOPE\n   Applies to all procurement activities exceeding Rp 5,000,000.\n\n3. PROCEDURE\n   3.1 Purchase Requisition\n       - Department submits PR via procurement system\n       - Budget verification by Finance (1 business day)\n       - Approval by Department Head\n\n   3.2 Supplier Selection\n       - Minimum 3 quotations required\n       - Evaluation based on: Price (40%), Quality (30%), Delivery (20%), Service (10%)\n\n   3.3 Purchase Order\n       - PO issuance within 2 business days of approval\n       - Terms: Net 30 days from delivery`,
  "Contract Guidelines": `PROCUREMENT CONTRACT GUIDELINES\n===============================\n\n1. CONTRACT TYPES\n   - Standard Supply Agreement (12 months)\n   - Framework Agreement (24 months)\n   - Project-Based Contract (as needed)\n\n2. ESSENTIAL CLAUSES\n   - Payment Terms: Net 30, early payment discount 2%\n   - Delivery SLA: As per category requirements\n   - Warranty: Minimum 12 months from delivery\n   - Penalty: 0.5%-5% for late delivery (tiered)\n\n3. APPROVAL MATRIX\n   - < Rp 100 Juta: Procurement Manager\n   - Rp 100 Juta - Rp 1 Miliar: Direktur Operasional\n   - > Rp 1 Miliar: Direktur Utama`,
  "Supplier Evaluation Report": `SUPPLIER EVALUATION METHODOLOGY\n================================\n\nEvaluation Criteria and Weights:\n\nPrice Competitiveness (40%)\n- Comparison against market average\n- Volume discount structure\n\nQuality Performance (30%)\n- Defect rate (target: < 1%)\n- Quality certification (ISO 9001 preferred)\n\nDelivery Performance (20%)\n- On-time delivery rate\n- Lead time consistency\n\nService Level (10%)\n- Communication responsiveness\n- Problem resolution time\n\nScoring Scale:\n- 90-100: Preferred Supplier\n- 75-89: Approved Supplier\n- 60-74: Conditional Supplier\n- Below 60: Probation/Disqualified`,
  "Annual Procurement Plan": `ANNUAL PROCUREMENT PLAN 2024\n=============================\n\nBudget Allocation: Rp 180.8 Miliar\n\nQuarterly Breakdown:\nQ1: Rp 42.5 Miliar (Raw materials restocking)\nQ2: Rp 48.3 Miliar (Equipment upgrades)\nQ3: Rp 45.2 Miliar (Normal operations)\nQ4: Rp 44.8 Miliar (Year-end procurement)\n\nKey Projects:\n1. Factory Line B Expansion - Rp 28 Miliar\n2. IT Infrastructure Upgrade - Rp 12 Miliar\n3. Warehouse Automation - Rp 18 Miliar\n\nStrategic Initiatives:\n- Supplier consolidation (reduce from 48 to 35 suppliers)\n- E-procurement system migration\n- Annual savings target: 5% cost reduction`,
};

function getDocumentContent(doc: Document): string {
  const customContent = SAMPLE_CONTENTS[doc.name];
  if (customContent) return customContent;
  return `${doc.name}\n${"=".repeat(doc.name.length)}\n\nDocument Type: ${doc.type}\nPages: ${doc.pages}\nDate: ${doc.date}\nStatus: ${doc.status.toUpperCase()}\n\nThis is a sample document from the SmartProcure Knowledge Base.\nSmartProcure AI - Intelligent Procurement Platform`;
}

export default function KnowledgeBasePage() {
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  function addFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    let nextId = documents.length > 0 ? Math.max(...documents.map((d) => d.id)) + 1 : 1;
    const newDocs: Document[] = fileArray.map((file) => ({
      id: nextId++,
      name: file.name.replace(/\.[^/.]+$/, ""),
      type: getExtension(file.name),
      size: formatFileSize(file.size),
      pages: Math.max(1, Math.floor(Math.random() * 20) + 1),
      status: "processing",
      date: new Date().toISOString().split("T")[0],
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    setTimeout(() => {
      setDocuments((prev) => prev.map((d) => newDocs.some((nd) => nd.id === d.id) ? { ...d, status: "processed" } : d));
      setUploading(false);
    }, 2000);
  }

  function handleDownload(doc: Document) {
    const content = getDocumentContent(doc);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${doc.name}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDelete(doc: Document) {
    if (window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt" className="hidden"
        onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ""; } }} />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <Library className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          Knowledge Base
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Upload and manage procurement documents for AI training
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 md:p-10 text-center transition-all",
          dragOver ? "border-secondary-500 bg-secondary-500/5" : "border-gray-300 dark:border-gray-600 hover:border-secondary-400 dark:hover:border-secondary-500"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files); }}
      >
        <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-500 mx-auto mb-3 md:mb-4" />
        <h3 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {uploading ? "Uploading..." : "Upload Document"}
        </h3>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4 max-w-md mx-auto">
          Drag & drop your PDF, DOCX, or TXT files here, or click to browse. Max 20 MB
        </p>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "Browse Files"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Total Documents</p><p className="text-xl md:text-2xl font-bold text-primary-900 dark:text-white">{documents.length + 19}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Total Chunks</p><p className="text-xl md:text-2xl font-bold text-secondary-500">1,847</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Last Upload</p><p className="text-base md:text-lg font-bold text-accent-500">Today</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Storage Used</p><p className="text-xl md:text-2xl font-bold text-primary-900 dark:text-white">156 MB</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="input-field pl-10" />
      </div>

      {/* Mobile: Card layout */}
      <div className="space-y-3 md:hidden">
        {filtered.map((doc) => (
          <div key={doc.id} className="widget-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-primary-900 dark:text-white truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.type} &middot; {doc.size} &middot; {doc.pages} pages</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("badge text-xs", doc.status === "processed" ? "badge-success" : "badge-warning")}>{doc.status}</span>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors" onClick={() => handleDownload(doc)}>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors" onClick={() => handleDelete(doc)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700/50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Document</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Size</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr key={doc.id} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent-500" />
                    </div>
                    <div><p className="font-medium text-primary-900 dark:text-white">{doc.name}</p><p className="text-xs text-gray-400">{doc.pages} pages</p></div>
                  </div>
                </td>
                <td className="py-4 px-6"><span className="badge badge-info">{doc.type}</span></td>
                <td className="py-4 px-6 text-sm text-gray-500">{doc.size}</td>
                <td className="py-4 px-6"><span className={cn("badge", doc.status === "processed" ? "badge-success" : "badge-warning")}>{doc.status}</span></td>
                <td className="py-4 px-6 text-sm text-gray-500">{doc.date}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors" onClick={() => handleDownload(doc)}><Download className="w-4 h-4 text-gray-400" /></button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors" onClick={() => handleDelete(doc)}><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
