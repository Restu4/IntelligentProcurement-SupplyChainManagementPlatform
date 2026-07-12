"use client";

import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DASHBOARD_STATS } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
          Welcome back, Restu. Here&apos;s your procurement overview.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {DASHBOARD_STATS.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="widget-card">
          <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white mb-3 md:mb-4">
            Forecast Trend
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-2xl md:text-3xl font-bold text-secondary-500">+12.5%</span>
            <span className="text-sm text-gray-400 mb-1">projected growth</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Based on current procurement velocity and market trends
          </p>
        </div>

        <div className="widget-card">
          <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white mb-3 md:mb-4">
            Supplier Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Active</span>
              <span className="text-sm font-semibold text-green-500">98</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">At Risk</span>
              <span className="text-sm font-semibold text-yellow-500">18</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">High Risk</span>
              <span className="text-sm font-semibold text-red-500">12</span>
            </div>
          </div>
        </div>

        <div className="widget-card">
          <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white mb-3 md:mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/knowledge-base")}
              className="btn-secondary w-full text-sm"
            >
              Upload Document
            </button>
            <button
              onClick={() => router.push("/purchase-orders")}
              className="btn-outline w-full text-sm"
            >
              Create PO
            </button>
            <button
              onClick={() => router.push("/forecast")}
              className="btn-outline w-full text-sm"
            >
              Run Forecast
            </button>
            <button
              onClick={() => router.push("/reports")}
              className="btn-outline w-full text-sm"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
