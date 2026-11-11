"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api, type PurchaseOrder } from "@/lib/api";
import { cn, formatIDRCompact, formatRelativeTime } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400",
};

export function RecentOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.purchaseOrders
      .list({ limit: 5 })
      .then((page) => {
        if (!cancelled) setOrders(page.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load purchase orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="widget-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
            Recent Purchase Orders
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest activity from the database
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400 py-6">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No purchase orders yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-primary-800/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-primary-900 dark:text-white text-sm truncate">
                  {order.po_number}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {order.supplier_name ?? "Unknown supplier"} &middot;{" "}
                  {formatRelativeTime(order.created_at)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-primary-900 dark:text-white">
                  {formatIDRCompact(order.amount)}
                </p>
                <span
                  className={cn(
                    "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                    STATUS_STYLES[order.status] ?? STATUS_STYLES.draft
                  )}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
