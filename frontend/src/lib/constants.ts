export interface SidebarItem {
  label: string;
  href: string;
  /** Key of the icon registered in components/layout/sidebar.tsx */
  icon: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "AI Assistant", href: "/ai-assistant", icon: "Bot" },
  { label: "Suppliers", href: "/suppliers", icon: "Building2" },
  { label: "Purchase Orders", href: "/purchase-orders", icon: "FileText" },
  { label: "Budget", href: "/budget", icon: "Wallet" },
  { label: "Forecast", href: "/forecast", icon: "TrendingUp" },
  { label: "Knowledge Base", href: "/knowledge-base", icon: "Library" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  { label: "Reports", href: "/reports", icon: "FileSpreadsheet" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
  /** Key of the icon registered in components/dashboard/stats-card.tsx */
  icon: string;
  color: string;
}

export const DASHBOARD_STATS: DashboardStat[] = [
  {
    label: "Total Budget",
    value: "Rp 115.0 M",
    change: "+4.2%",
    icon: "Wallet",
    color: "text-secondary-500",
  },
  {
    label: "Total Spent",
    value: "Rp 91.0 M",
    change: "+7.8%",
    icon: "PiggyBank",
    color: "text-accent-500",
  },
  {
    label: "Active Suppliers",
    value: "4",
    change: "+2",
    icon: "Building2",
    color: "text-blue-500",
  },
  {
    label: "High Risk",
    value: "1",
    change: "-1",
    icon: "AlertTriangle",
    color: "text-red-500",
  },
  {
    label: "Documents",
    value: "25",
    change: "+25",
    icon: "FileText",
    color: "text-green-500",
  },
  {
    label: "Pending POs",
    value: "3",
    change: "+1",
    icon: "Clock",
    color: "text-yellow-500",
  },
];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SUPPLIER_STATUSES = ["active", "inactive", "blacklisted"] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export const PO_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
] as const;
export type POStatus = (typeof PO_STATUSES)[number];

export const FORECAST_TYPES = ["price", "risk", "budget", "demand"] as const;
export type ForecastType = (typeof FORECAST_TYPES)[number];

/** Confidence bands used across the UI (values are 0-100). */
export const CONFIDENCE = {
  high: 80,
  medium: 60,
} as const;

export function confidenceTone(confidence: number): "high" | "medium" | "low" {
  if (confidence >= CONFIDENCE.high) return "high";
  if (confidence >= CONFIDENCE.medium) return "medium";
  return "low";
}
