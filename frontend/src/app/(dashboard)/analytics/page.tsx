"use client";

import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const categoryData = [
  { name: "Raw Materials", value: 45 },
  { name: "Logistics", value: 20 },
  { name: "Equipment", value: 15 },
  { name: "Services", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = ["#14B8A6", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

const monthlyData = [
  { month: "Jan", orders: 28, spending: 18.5 },
  { month: "Feb", orders: 32, spending: 22.3 },
  { month: "Mar", orders: 26, spending: 19.8 },
  { month: "Apr", orders: 38, spending: 25.1 },
  { month: "May", orders: 35, spending: 23.7 },
  { month: "Jun", orders: 42, spending: 28.4 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Deep insights into your procurement operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="widget-card">
          <p className="text-sm text-gray-500">Total Orders YTD</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">342</p>
          <span className="text-xs text-green-500">+18% vs last year</span>
        </div>
        <div className="widget-card">
          <p className="text-sm text-gray-500">Total Spend YTD</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">Rp 92.5B</p>
          <span className="text-xs text-green-500">+12% vs last year</span>
        </div>
        <div className="widget-card">
          <p className="text-sm text-gray-500">Avg Order Value</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">Rp 270M</p>
          <span className="text-xs text-red-500">-3% vs last year</span>
        </div>
        <div className="widget-card">
          <p className="text-sm text-gray-500">Supplier Diversity</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">24%</p>
          <span className="text-xs text-green-500">+5% improvement</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="widget-card">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-6">
            Monthly Orders & Spending
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-gray-400" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-gray-400" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-gray-400" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                <Bar yAxisId="left" dataKey="orders" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Orders" />
                <Bar yAxisId="right" dataKey="spending" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Spending (B)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="widget-card">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-6">
            Spending by Category
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
