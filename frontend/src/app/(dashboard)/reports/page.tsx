"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import { api, ApiError, type ReportSummary } from "@/lib/api";
import {
  formatDate,
  formatIDR,
  formatIDRCompact,
  formatNumber,
} from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => CURRENT_YEAR - index);

type Cell = string | number | null | undefined;

function csvCell(value: Cell): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

function downloadFile(filename: string, content: string) {
  // The BOM keeps Excel from mangling non-ASCII supplier names.
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.reports.summary(year));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportBudgets() {
    if (!summary) return;
    const csv = toCsv(
      [
        "Department",
        "Fiscal Year",
        "Total Budget",
        "Allocated",
        "Remaining",
        "Utilization (%)",
      ],
      summary.budgets.map((row) => [
        row.department,
        row.fiscal_year,
        row.total_budget,
        row.allocated,
        row.remaining,
        row.utilization,
      ])
    );
    downloadFile(`budget_utilization_${summary.fiscal_year}.csv`, csv);
  }

  function exportSuppliers() {
    if (!summary) return;
    const csv = toCsv(
      [
        "Supplier",
        "Category",
        "Status",
        "Risk Level",
        "Delivery Score",
        "Quality Score",
      ],
      summary.suppliers.map((row) => [
        row.name,
        row.category,
        row.status,
        row.risk_level,
        row.delivery_score,
        row.quality_score,
      ])
    );
    downloadFile(`supplier_performance_${summary.fiscal_year}.csv`, csv);
  }

  function exportPurchaseOrders() {
    if (!summary) return;
    const csv = toCsv(
      [
        "PO Number",
        "Supplier",
        "Amount",
        "Status",
        "Approval Level",
        "Created At",
      ],
      summary.purchase_orders.map((row) => [
        row.po_number,
        row.supplier_name,
        row.amount,
        row.status,
        row.approval_level,
        row.created_at,
      ])
    );
    downloadFile(`purchase_orders_${summary.fiscal_year}.csv`, csv);
  }

  const totals = summary?.totals;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <FileSpreadsheet className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Export live procurement data as CSV
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          Fiscal year
          <select
            className="input-field py-2 pr-8"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="widget-card flex items-center gap-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !summary ? (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-16">
          <Loader2 className="w-4 h-4 animate-spin" />
          Building report...
        </div>
      ) : summary ? (
        <>
          <p className="text-xs text-gray-400">
            Generated {formatDate(summary.generated_at, { dateStyle: "medium", timeStyle: "short" })}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatIDRCompact(totals?.total_budget ?? 0)}
              </p>
            </div>
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spend</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatIDRCompact(totals?.spend ?? 0)}
              </p>
            </div>
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Orders</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatNumber(totals?.purchase_orders ?? 0)}
              </p>
            </div>
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Suppliers</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatNumber(summary.suppliers.length)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <button
              className="widget-card text-left group disabled:opacity-50"
              onClick={exportBudgets}
              disabled={summary.budgets.length === 0}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary-500/10 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
              </div>
              <h3 className="font-semibold text-primary-900 dark:text-white text-sm md:text-base">
                Budget Utilization
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {summary.budgets.length} department
                {summary.budgets.length === 1 ? "" : "s"} allocated
              </p>
            </button>

            <button
              className="widget-card text-left group disabled:opacity-50"
              onClick={exportSuppliers}
              disabled={summary.suppliers.length === 0}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-accent-500" />
              </div>
              <h3 className="font-semibold text-primary-900 dark:text-white text-sm md:text-base">
                Supplier Performance
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {summary.suppliers.length} supplier
                {summary.suppliers.length === 1 ? "" : "s"} with risk and scores
              </p>
            </button>

            <button
              className="widget-card text-left group disabled:opacity-50"
              onClick={exportPurchaseOrders}
              disabled={summary.purchase_orders.length === 0}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-primary-900 dark:text-white text-sm md:text-base">
                Purchase Order Register
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {summary.purchase_orders.length} order
                {summary.purchase_orders.length === 1 ? "" : "s"} in fiscal year {summary.fiscal_year}
              </p>
            </button>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
                Purchase Order Register
              </h3>
              <button
                className="btn-secondary flex items-center gap-2 text-sm"
                onClick={exportPurchaseOrders}
                disabled={summary.purchase_orders.length === 0}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            {summary.purchase_orders.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
                No purchase orders in {summary.fiscal_year}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/30">
                      <th className="px-4 md:px-6 py-3 font-medium">PO Number</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Supplier</th>
                      <th className="px-4 md:px-6 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Status</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Approval</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
                    {summary.purchase_orders.slice(0, 20).map((row) => (
                      <tr
                        key={row.po_number}
                        className="hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors"
                      >
                        <td className="px-4 md:px-6 py-3 font-medium text-primary-900 dark:text-white">
                          {row.po_number}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-600 dark:text-gray-300">
                          {row.supplier_name ?? "-"}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                          {formatIDR(row.amount)}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-600 dark:text-gray-300 capitalize">
                          {row.status}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-600 dark:text-gray-300">
                          {row.approval_level ?? "-"}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-600 dark:text-gray-300">
                          {formatDate(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
