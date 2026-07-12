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

const data = [
  { month: "Jan", spending: 18.5, forecast: 17.0 },
  { month: "Feb", spending: 22.3, forecast: 21.0 },
  { month: "Mar", spending: 19.8, forecast: 20.0 },
  { month: "Apr", spending: 25.1, forecast: 23.5 },
  { month: "May", spending: 23.7, forecast: 24.0 },
  { month: "Jun", spending: 28.4, forecast: 26.0 },
  { month: "Jul", spending: 26.2, forecast: 27.0 },
  { month: "Aug", spending: 30.5, forecast: 28.5 },
  { month: "Sep", spending: 27.9, forecast: 29.0 },
  { month: "Oct", spending: 32.1, forecast: 30.0 },
  { month: "Nov", spending: 29.8, forecast: 31.0 },
  { month: "Dec", spending: 35.2, forecast: 33.0 },
];

export function SpendingChart() {
  return (
    <div className="widget-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
            Monthly Spending
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Actual vs Forecast (in billions)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary-500" />
            <span className="text-gray-500">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-500/50" />
            <span className="text-gray-500">Forecast</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
              tickFormatter={(v) => `${v}B`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="spending"
              stroke="#14B8A6"
              strokeWidth={2}
              fill="url(#spendingGradient)"
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
