"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Moon, Sun, X, FileText, AlertTriangle, Upload, TrendingDown, ChevronRight, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface NotifItem {
  id: number;
  icon: typeof FileText;
  iconColor: string;
  title: string;
  time: string;
  link: string;
}

const SAMPLE_NOTIFICATIONS: NotifItem[] = [
  {
    id: 1,
    icon: FileText,
    iconColor: "text-blue-500 bg-blue-500/10",
    title: "PO-2024-089 has been approved",
    time: "2 min ago",
    link: "/purchase-orders",
  },
  {
    id: 2,
    icon: AlertTriangle,
    iconColor: "text-red-500 bg-red-500/10",
    title: "Supplier PT Surya Pratama flagged as at-risk",
    time: "1 hour ago",
    link: "/suppliers",
  },
  {
    id: 3,
    icon: Upload,
    iconColor: "text-green-500 bg-green-500/10",
    title: "New document uploaded: Q4 Supplier Report",
    time: "3 hours ago",
    link: "/knowledge-base",
  },
  {
    id: 4,
    icon: TrendingDown,
    iconColor: "text-amber-500 bg-amber-500/10",
    title: "Budget alert: Raw Materials at 93% utilization",
    time: "5 hours ago",
    link: "/budget",
  },
];

const SAMPLE_SEARCH_RESULTS = [
  "Purchase Order PO-2024-091",
  "Supplier PT Maju Bersama",
  "Budget Report - Q4 2024",
  "Contract #CTR-2024-015",
  "Invoice INV-2024-347",
];

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowAllNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = SAMPLE_NOTIFICATIONS.filter((n) => !readIds.includes(n.id)).length;

  const filteredSearchResults = SAMPLE_SEARCH_RESULTS.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedNotifications = showAllNotifications
    ? SAMPLE_NOTIFICATIONS
    : SAMPLE_NOTIFICATIONS.slice(0, 4);

  function handleNotificationClick(notif: NotifItem) {
    setReadIds((prev) => (prev.includes(notif.id) ? prev : [...prev, notif.id]));
    setShowNotifications(false);
    router.push(notif.link);
  }

  function handleViewAll(e: React.MouseEvent) {
    e.stopPropagation();
    if (showAllNotifications) {
      setShowAllNotifications(false);
    } else {
      setShowAllNotifications(true);
      setReadIds(SAMPLE_NOTIFICATIONS.map((n) => n.id));
    }
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-200 dark:border-gray-700/50 px-4 md:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Left: hamburger (mobile) + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors lg:hidden shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="relative flex-1 min-w-0 max-w-xl" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="input-field pl-10 w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (searchQuery.length > 0) setShowSearchResults(true);
              }}
            />
            {showSearchResults && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-primary-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700/50">
                  {filteredSearchResults.length > 0 ? "Results" : "No results found"}
                </div>
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((result, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-primary-700/50 transition-colors text-left"
                      onClick={() => {
                        setSearchQuery(result);
                        setShowSearchResults(false);
                      }}
                    >
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{result}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No results for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: theme + notifications + user */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 md:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-primary-600" />
            )}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-colors relative",
                showNotifications
                  ? "bg-gray-100 dark:bg-primary-800"
                  : "hover:bg-gray-100 dark:hover:bg-primary-800"
              )}
            >
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-primary-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-primary-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                  <h3 className="text-sm font-semibold text-primary-900 dark:text-white">
                    Notifications {unreadCount > 0 && <span className="text-gray-400 font-normal">({unreadCount} unread)</span>}
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-80 overflow-y-auto">
                  {displayedNotifications.map((notif) => {
                    const Icon = notif.icon;
                    const isRead = readIds.includes(notif.id);
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-primary-700/50 transition-colors text-left cursor-pointer",
                          isRead && "opacity-60"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg shrink-0 mt-0.5",
                            notif.iconColor
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-secondary-500 shrink-0 mt-1.5" />
                            )}
                            <div className="flex-1">
                              <p className={cn("text-sm leading-snug", isRead ? "text-gray-500 dark:text-gray-400" : "text-primary-900 dark:text-gray-100 font-medium")}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notif.time}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 mt-1" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    onClick={handleViewAll}
                    className="w-full text-center text-xs font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors py-1 cursor-pointer"
                  >
                    {showAllNotifications ? "Show less" : "View all notifications"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-2 md:pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-primary-900 dark:text-gray-100">
                Restu
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Procurement Manager
              </p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-accent-500/20 text-sm">
              R
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
