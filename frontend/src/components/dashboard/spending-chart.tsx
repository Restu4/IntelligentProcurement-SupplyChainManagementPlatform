"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyPoint } from "@/lib/api";
import { formatIDRCompact } from "@/lib/utils";

interface SpendingChartProps {
  data: MonthlyPoint[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  const chartData = data.map((point) => ({
    month: point.month,
    spend: point.spend,
    orders: point.orders,
  }));

  return (
    <div className="widget-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
            Monthly Spending
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Approved and completed purchase orders
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-secondary-500" />
          <span className="text-gray-500">Actual</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-gray-400"
              width={70}
              tickFormatter={(value) => formatIDRCompact(Number(value))}
            />
            <Tooltip
              formatter={(value, name) =>
                name === "spend"
                  ? [formatIDRCompact(Number(value)), "Spend"]
                  : [String(value), "Orders"]
              }
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#14B8A6"
              strokeWidth={2}
              fill="url(#spendingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
