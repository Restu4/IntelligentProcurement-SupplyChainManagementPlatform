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
