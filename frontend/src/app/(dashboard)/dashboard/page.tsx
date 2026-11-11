"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { api, ApiError, type AnalyticsOverview, type User } from "@/lib/api";
import { formatIDRCompact, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, me] = await Promise.all([
        api.analytics.overview(),
        api.auth.me(),
      ]);
      setOverview(data);
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = overview?.totals;
  const displayName = user?.full_name?.trim() || user?.username || "there";

  const stats = totals
    ? [
        {
          label: "Total Budget",
          value: formatIDRCompact(totals.total_budget),
          hint: `${totals.utilization.toFixed(1)}% allocated`,
          icon: "Wallet",
          color: "text-secondary-500",
        },
        {
          label: "Total Spent",
          value: formatIDRCompact(totals.spend),
          hint: "approved + completed POs",
          icon: "PiggyBank",
          color: "text-accent-500",
        },
        {
          label: "Active Suppliers",
          value: formatNumber(totals.active_suppliers),
          hint: `${formatNumber(totals.high_risk_suppliers)} high risk`,
          icon: "Building2",
          color: "text-blue-500",
        },
        {
          label: "Documents",
          value: formatNumber(totals.documents),
          hint: "in the knowledge base",
          icon: "FileText",
          color: "text-green-500",
        },
        {
          label: "Pending POs",
          value: formatNumber(totals.pending_pos),
          hint: `${formatIDRCompact(totals.pending_amount)} awaiting approval`,
          icon: "Clock",
          color: "text-yellow-500",
        },
        {
          label: "Avg Order Value",
          value: formatIDRCompact(totals.avg_order_value),
          hint: "per approved PO",
          icon: "TrendingUp",
          color: "text-purple-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
            Welcome back, {displayName}. Here&apos;s your procurement overview
            {overview ? ` for fiscal year ${overview.fiscal_year}` : ""}.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="btn-outline flex items-center gap-2 text-sm shrink-0"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="widget-card flex items-center justify-between gap-4 border border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => void load()} className="btn-secondary text-sm">
            Retry
          </button>
        </div>
      )}

      {loading && !overview ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="widget-card h-28 animate-pulse bg-gray-100/60 dark:bg-primary-800/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <SpendingChart data={overview.monthly} />
          </div>
          <RecentOrders />
        </div>
      )}

      {loading && !overview && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-12">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your procurement data...
        </div>
      )}
    </div>
  );
}
