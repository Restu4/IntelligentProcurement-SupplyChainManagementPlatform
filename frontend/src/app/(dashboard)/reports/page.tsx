"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, FileText, Printer, BarChart3 } from "lucide-react";

const reports = [
  { name: "Monthly Procurement Summary", type: "PDF", date: "Dec 2024", size: "2.3 MB" },
  { name: "Supplier Performance Q4 2024", type: "Excel", date: "Dec 2024", size: "1.8 MB" },
  { name: "Budget Utilization Report", type: "PDF", date: "Nov 2024", size: "1.2 MB" },
  { name: "Procurement Forecast Q1 2025", type: "PDF", date: "Dec 2024", size: "3.5 MB" },
  { name: "Supplier Risk Assessment", type: "Excel", date: "Dec 2024", size: "856 KB" },
];

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateReportContent(name: string): string {
  const now = new Date().toISOString();
  return [
    `Report: ${name}`,
    `Generated: ${now}`,
    ``,
    `--- Summary ---`,
    `Total Procurement Value: Rp 4,250,000,000`,
    `Active Suppliers: 42`,
    `Pending Orders: 18`,
    `Completed Transactions: 156`,
    ``,
    `--- Key Metrics ---`,
    `Cost Savings: 12.5%`,
    `On-Time Delivery Rate: 94.2%`,
    `Quality Compliance: 97.8%`,
    `Average Processing Time: 3.2 days`,
  ].join("\n");
}

export default function ReportsPage() {
  const [generatingCard, setGeneratingCard] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  function handleExportAll() {
    setExportingAll(true);
    setTimeout(() => {
      const header = "Report Name,Type,Date,Size";
      const rows = reports.map((r) => `"${r.name}",${r.type},${r.date},${r.size}`).join("\n");
      downloadFile("all_reports.csv", `${header}\n${rows}`, "text/csv");
      setExportingAll(false);
    }, 1000);
  }

  function handleDownloadReport(report: { name: string }) {
    downloadFile(`${report.name.replace(/\s+/g, "_")}.txt`, generateReportContent(report.name), "text/plain");
  }

  function handleGenerateCard(label: string) {
    setGeneratingCard(label);
    setTimeout(() => {
      downloadFile(`${label.replace(/\s+/g, "_")}_Report.txt`, generateReportContent(label), "text/plain");
      setGeneratingCard(null);
    }, 1500);
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <FileSpreadsheet className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          Reports
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Generate and export procurement reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <button className="widget-card text-left group" onClick={() => handleGenerateCard("Procurement Summary")} disabled={generatingCard !== null}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary-500/10 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
          </div>
          <h3 className="font-semibold text-primary-900 dark:text-white text-sm md:text-base">
            {generatingCard === "Procurement Summary" ? "Generating..." : "Procurement Summary"}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Monthly procurement overview</p>
        </button>
        <button className="widget-card text-left group" onClick={() => handleGenerateCard("Supplier Performance")} disabled={generatingCard !== null}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-accent-500" />
          </div>
          <h3 className="font-semibold text-primary-900 dark:text-white text-sm md:text-base">
            {generatingCard === "Supplier Performance" ? "Generating..." : "Supplier Performance"}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Supplier evaluation report</p>
        </button>
        <button className="widget-card text-left group" onClick={() => handleGenerateCard("Full Export")} disabled={generatingCard !== null}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Printer className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
          </div>
          <h3 className="font-semibold text-primary-900 dark:text-white text-sm md:text-base">
            {generatingCard === "Full Export" ? "Generating..." : "Full Export"}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Export all data to Excel/PDF</p>
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">Recent Reports</h3>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={handleExportAll} disabled={exportingAll}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{exportingAll ? "Exporting..." : "Export All"}</span>
            <span className="sm:hidden">{exportingAll ? "..." : "Export"}</span>
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
          {reports.map((report, idx) => (
            <div key={idx} className="p-3 md:p-6 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
                  {report.type === "PDF" ? <FileText className="w-4 h-4 md:w-5 md:h-5 text-red-500" /> : <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5 text-green-500" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-primary-900 dark:text-white text-sm md:text-base truncate">{report.name}</p>
                  <p className="text-xs text-gray-400">{report.date} &middot; {report.size}</p>
                </div>
              </div>
              <button className="btn-outline flex items-center gap-2 text-xs md:text-sm shrink-0" onClick={() => handleDownloadReport(report)}>
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
