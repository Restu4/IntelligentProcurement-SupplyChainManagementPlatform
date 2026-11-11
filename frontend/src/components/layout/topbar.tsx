"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { api, tokenStore, type User } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";

interface SearchResult {
  key: string;
  label: string;
  meta: string;
  href: string;
  kind: "supplier" | "purchase_order";
}

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void api.auth
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      void Promise.all([
        api.suppliers.list({ q: query, limit: 5 }),
        api.purchaseOrders.list({ q: query, limit: 5 }),
      ])
        .then(([suppliers, orders]) => {
          if (cancelled) return;
          const next: SearchResult[] = [
            ...suppliers.map((supplier) => ({
              key: `supplier-${supplier.id}`,
              label: supplier.name,
              meta: `${supplier.category ?? "Uncategorised"} · ${supplier.status}`,
              href: `/suppliers?q=${encodeURIComponent(supplier.name)}`,
              kind: "supplier" as const,
            })),
            ...orders.items.map((order) => ({
              key: `po-${order.id}`,
              label: order.po_number,
              meta: `${order.supplier_name ?? "Unknown supplier"} · ${order.status}`,
              href: `/purchase-orders?q=${encodeURIComponent(order.po_number)}`,
              kind: "purchase_order" as const,
            })),
          ];
          setResults(next);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await api.auth.logout();
    } finally {
      tokenStore.clear();
      router.push("/login");
    }
  }

  const displayName = user?.full_name?.trim() || user?.username || "Account";

  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-200 dark:border-gray-700/50 px-4 md:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Left: hamburger (mobile) + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors lg:hidden shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="relative flex-1 min-w-0 max-w-xl" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers or purchase orders..."
              className="input-field pl-10 w-full"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSearchResults(event.target.value.trim().length >= 2);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSearchResults(true);
              }}
            />
            {showSearchResults && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-primary-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-2">
                  {searching ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                    </>
                  ) : results.length > 0 ? (
                    "Results"
                  ) : (
                    "No results found"
                  )}
                </div>
                {results.map((result) => {
                  const Icon = result.kind === "supplier" ? Building2 : FileText;
                  return (
                    <button
                      key={result.key}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-primary-700/50 transition-colors text-left"
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                        router.push(result.href);
                      }}
                    >
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{result.label}</span>
                        <span className="block truncate text-xs text-gray-400">
                          {result.meta}
                        </span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: theme + user */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 md:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-primary-600" />
            )}
          </button>

          <div className="flex items-center gap-3 pl-2 md:pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-primary-900 dark:text-gray-100">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role ?? "signed in"}
              </p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-accent-500/20 text-sm">
              {getInitials(displayName)}
            </div>
            <button
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className={cn(
                "p-2 rounded-xl text-gray-500 dark:text-gray-400",
                "hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
              )}
              aria-label="Sign out"
              title="Sign out"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
