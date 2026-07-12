"use client";

import {
  Wallet,
  PiggyBank,
  Building2,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Wallet,
  PiggyBank,
  Building2,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
};

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

export function StatsCard({ label, value, change, icon, color }: StatsCardProps) {
  const Icon = iconMap[icon];
  const isPositive = change.startsWith("+");

  return (
    <div className="widget-card group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-primary-900 dark:text-white tracking-tight">
            {value}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-semibold",
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {change}
            </span>
            <span className="text-xs text-gray-400">vs last month</span>
          </div>
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-gray-100 dark:bg-primary-800 group-hover:scale-110 transition-transform"
          )}
        >
          <Icon className={cn("w-6 h-6", color)} />
        </div>
      </div>
    </div>
  );
}
