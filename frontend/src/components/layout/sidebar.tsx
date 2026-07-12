"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Building2,
  Wallet,
  FileText,
  TrendingUp,
  Library,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/lib/constants";

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Bot,
  Building2,
  Wallet,
  FileText,
  TrendingUp,
  Library,
  BarChart3,
  FileSpreadsheet,
  Settings,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-gray-200 dark:border-gray-700/50 transition-all duration-300 ease-in-out",
          "bg-white dark:bg-primary-900/95 backdrop-blur-xl",
          // Desktop: normal collapse behavior
          "hidden lg:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex flex-col border-r border-gray-200 dark:border-gray-700/50 transition-all duration-300 ease-in-out h-screen",
          "bg-white dark:bg-primary-900/95 backdrop-blur-xl w-64 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <SidebarContent collapsed={false} onToggle={() => {}} pathname={pathname} onLinkClick={onMobileClose} />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, onToggle, pathname, onLinkClick }: {
  collapsed: boolean;
  onToggle: () => void;
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-gray-700/50 overflow-hidden whitespace-nowrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/20 shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div
          className={cn(
            "flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <span className="font-bold text-lg text-primary-900 dark:text-white tracking-tight">
            SmartProcure
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
            AI Platform
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "sidebar-item",
                isActive ? "sidebar-item-active" : "sidebar-item-inactive",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                {item.label}
              </span>
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-5 rounded-full bg-secondary-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700/50 space-y-2">
        <button
          onClick={onToggle}
          className="sidebar-item sidebar-item-inactive w-full"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Collapse
          </span>
        </button>
        <button className="sidebar-item sidebar-item-inactive w-full text-red-500 hover:text-red-600">
          <LogOut className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Logout
          </span>
        </button>
      </div>
    </>
  );
}
