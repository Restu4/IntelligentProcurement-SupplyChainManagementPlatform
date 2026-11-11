"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BarChart3, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError, type AnalyticsOverview } from "@/lib/api";
import { formatIDRCompact, formatNumber } from "@/lib/utils";

const COLORS = ["#14B8A6", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => CURRENT_YEAR - index);

export default function AnalyticsPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.analytics.overview(year));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = data?.totals;
  const monthly = data?.monthly ?? [];
  const categories = data?.categories ?? [];
  const statuses = data?.status_breakdown ?? [];
  const hasActivity = (totals?.purchase_orders ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Live procurement insights computed from the database
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

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-16">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Orders</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatNumber(totals?.purchase_orders ?? 0)}
              </p>
              <span className="text-xs text-gray-400">
                {formatNumber(totals?.completed_pos ?? 0)} completed
              </span>
            </div>
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spend</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatIDRCompact(totals?.spend ?? 0)}
              </p>
              <span className="text-xs text-gray-400">approved + completed</span>
            </div>
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Amount</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatIDRCompact(totals?.pending_amount ?? 0)}
              </p>
              <span className="text-xs text-gray-400">
                {formatNumber(totals?.pending_pos ?? 0)} awaiting approval
              </span>
            </div>
            <div className="widget-card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Order Value</p>
              <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                {formatIDRCompact(totals?.avg_order_value ?? 0)}
              </p>
              <span className="text-xs text-gray-400">per approved PO</span>
            </div>
          </div>

          {!hasActivity && (
            <div className="widget-card text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No purchase orders for fiscal year {year}. Choose another year or
                create a purchase order.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="widget-card">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-6">
                Monthly Orders &amp; Spending
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthly}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-gray-200 dark:text-gray-700"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-gray-400"
                    />
                    <YAxis
                      yAxisId="left"
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-gray-400"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-gray-400"
                      width={70}
                      tickFormatter={(value) => formatIDRCompact(Number(value))}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "Spend"
                          ? [formatIDRCompact(Number(value)), "Spend"]
                          : [String(value), "Orders"]
                      }
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="orders"
                      fill="#14B8A6"
                      radius={[4, 4, 0, 0]}
                      name="Orders"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="spend"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Spend"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="widget-card">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-6">
                Spending by Supplier Category
              </h3>
              {categories.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No approved spending for this year.
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="spend"
                        nameKey="category"
                      >
                        {categories.map((entry, index) => (
                          <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip
                        formatter={(value) => formatIDRCompact(Number(value))}
                        contentStyle={{
                          backgroundColor: "rgba(15,23,42,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="widget-card">
            <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
              Purchase Order Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {statuses.map((item) => (
                <div
                  key={item.status}
                  className="rounded-xl border border-gray-200 dark:border-gray-700/50 p-3"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {item.status}
                  </p>
                  <p className="text-xl font-bold text-primary-900 dark:text-white mt-1">
                    {formatNumber(item.count)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatIDRCompact(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
