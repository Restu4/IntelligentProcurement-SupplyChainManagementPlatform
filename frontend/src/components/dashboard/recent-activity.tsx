"use client";

import { Clock, Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const activities = [
  {
    icon: Upload,
    color: "text-accent-500 bg-accent-500/10",
    text: "New document uploaded: Supplier Report Q4",
    time: "2 minutes ago",
  },
  {
    icon: FileText,
    color: "text-secondary-500 bg-secondary-500/10",
    text: "Purchase Order #PO-2024-089 approved",
    time: "15 minutes ago",
  },
  {
    icon: AlertTriangle,
    color: "text-red-500 bg-red-500/10",
    text: "Supplier PT Bumi Persada flagged as High Risk",
    time: "1 hour ago",
  },
  {
    icon: CheckCircle,
    color: "text-green-500 bg-green-500/10",
    text: "AI Forecast updated for Q1 2025",
    time: "2 hours ago",
  },
  {
    icon: Upload,
    color: "text-accent-500 bg-accent-500/10",
    text: "Contract guideline PDF processed successfully",
    time: "3 hours ago",
  },
  {
    icon: FileText,
    color: "text-secondary-500 bg-secondary-500/10",
    text: "Budget allocation for IT Department updated",
    time: "5 hours ago",
  },
];

export function RecentActivity() {
  return (
    <div className="widget-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest platform activities
          </p>
        </div>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const Icon = activity.icon;
          return (
            <div key={idx} className="flex items-start gap-4 group">
              <div
                className={`w-9 h-9 rounded-xl ${activity.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {activity.text}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
