"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FileText, Plus, Search, Filter, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api, ApiError, type PurchaseOrder, type Supplier } from "@/lib/api";
import { cn, formatIDR } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  completed: "badge-info",
  draft: "badge-info",
  rejected: "badge-danger",
  cancelled: "badge-danger",
};

const STATUS_FILTERS = ["all", "draft", "pending", "approved", "rejected", "completed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const NEXT_ACTION: Record<string, { label: string; status: string } | undefined> = {
  draft: { label: "Submit", status: "pending" },
  pending: { label: "Approve", status: "approved" },
  approved: { label: "Complete", status: "completed" },
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");

  /* ------------------------------ data loading ----------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.purchaseOrders.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        q: query || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query, page]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    void api.suppliers
      .list({ limit: 200 })
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
    void api.auth
      .me()
      .then((user) => setIsAdmin(user.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  /* -------------------------------- actions -------------------------------- */

  const refresh = () => setReloadKey((key) => key + 1);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newSupplierId || !newAmount) return;

    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await api.purchaseOrders.create({
        supplier_id: Number(newSupplierId),
        amount,
        description: newDescription.trim() || null,
      });
      setNotice(`Created ${created.po_number} (${created.approval_level ?? "approval pending"}).`);
      setShowModal(false);
      setNewSupplierId("");
      setNewAmount("");
      setNewDescription("");
      setPage(0);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the purchase order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(order: PurchaseOrder, status: string) {
    setError(null);
    try {
      await api.purchaseOrders.update(order.id, { status });
      setNotice(`${order.po_number} moved to ${status}.`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status update failed.");
    }
  }

  async function removeOrder(order: PurchaseOrder) {
    if (!window.confirm(`Delete ${order.po_number}? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.purchaseOrders.remove(order.id);
      setNotice(`${order.po_number} deleted.`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed.");
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Purchase Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {total} purchase order{total === 1 ? "" : "s"} · approval levels follow PRC-POG-002
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-secondary flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" />
            Create PO
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search PO number, supplier, or description..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(0);
            }}
            className="input-field pl-10 pr-8 appearance-none cursor-pointer"
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All Status" : value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="widget-card flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading purchase orders...
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {orders.length === 0 && (
              <div className="widget-card text-center text-gray-400 py-8">
                No purchase orders found.
              </div>
            )}
            {orders.map((order) => (
              <div key={order.id} className="widget-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold text-primary-900 dark:text-white">
                    {order.po_number}
                  </span>
                  <span className={cn("badge text-xs", statusColors[order.status])}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{order.supplier_name ?? "Unknown supplier"}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-primary-900 dark:text-white">
                    {formatIDR(order.amount)}
                  </span>
                  <span className="text-xs text-gray-400">{order.approval_level ?? "-"}</span>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {NEXT_ACTION[order.status] && (
                      <button
                        onClick={() => changeStatus(order, NEXT_ACTION[order.status]!.status)}
                        className="btn-outline text-xs"
                      >
                        {NEXT_ACTION[order.status]!.label}
                      </button>
                    )}
                    {order.status === "draft" && (
                      <button
                        onClick={() => removeOrder(order)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Approval</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  {isAdmin && (
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-gray-400">
                      No purchase orders match your search or filter criteria.
                    </td>
                  </tr>
                )}
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-sm font-medium text-primary-900 dark:text-white">
                      {order.po_number}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {order.supplier_name ?? "Unknown supplier"}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-primary-900 dark:text-white">
                      {formatIDR(order.amount)}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {order.approval_level ?? "-"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("badge", statusColors[order.status])}>{order.status}</span>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {NEXT_ACTION[order.status] && (
                            <button
                              onClick={() => changeStatus(order, NEXT_ACTION[order.status]!.status)}
                              className="text-xs font-medium text-secondary-500 hover:underline"
                            >
                              {NEXT_ACTION[order.status]!.label}
                            </button>
                          )}
                          {order.status === "pending" && (
                            <button
                              onClick={() => changeStatus(order, "rejected")}
                              className="text-xs font-medium text-yellow-600 hover:underline"
                            >
                              Reject
                            </button>
                          )}
                          {["draft", "pending", "approved"].includes(order.status) && (
                            <button
                              onClick={() => changeStatus(order, "cancelled")}
                              className="text-xs font-medium text-gray-400 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                          {order.status === "draft" && (
                            <button
                              onClick={() => removeOrder(order)}
                              className="text-xs font-medium text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0 || loading}
                className="btn-outline flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setPage((current) => (current + 1 < pageCount ? current + 1 : current))}
                disabled={page + 1 >= pageCount || loading}
                className="btn-outline flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreate}
            className="glass rounded-2xl border border-gray-200 dark:border-gray-700/50 w-full max-w-md p-5 md:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900 dark:text-white">
                Create Purchase Order
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
                <select
                  value={newSupplierId}
                  onChange={(event) => setNewSupplierId(event.target.value)}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Amount (IDR)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(event) => setNewAmount(event.target.value)}
                  placeholder="e.g. 150000000"
                  className="input-field w-full"
                  min={1}
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Approval level is assigned automatically from the amount.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  placeholder="e.g. Office supplies"
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-secondary disabled:opacity-50">
                {submitting ? "Creating..." : "Create PO"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
