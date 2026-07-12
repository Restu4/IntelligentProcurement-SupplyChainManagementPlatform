"use client";

import { useState } from "react";
import { FileText, Plus, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  po: string;
  supplier: string;
  amount: number;
  status: string;
  date: string;
}

const initialOrders: Order[] = [
  { po: "PO-2024-089", supplier: "PT Surya Pratama", amount: 150000000, status: "approved", date: "2024-12-15" },
  { po: "PO-2024-088", supplier: "PT Maju Jaya", amount: 75000000, status: "pending", date: "2024-12-14" },
  { po: "PO-2024-087", supplier: "CV Sukses Abadi", amount: 200000000, status: "completed", date: "2024-12-10" },
  { po: "PO-2024-086", supplier: "PT Karya Mandiri", amount: 95000000, status: "draft", date: "2024-12-08" },
  { po: "PO-2024-085", supplier: "PT Indo Logistik", amount: 50000000, status: "approved", date: "2024-12-05" },
  { po: "PO-2024-084", supplier: "PT Bumi Persada", amount: 180000000, status: "completed", date: "2024-12-01" },
  { po: "PO-2024-083", supplier: "CV Teknik Solusi", amount: 60000000, status: "rejected", date: "2024-11-28" },
];

const suppliers = [
  "PT Surya Pratama",
  "PT Maju Jaya",
  "CV Sukses Abadi",
  "PT Karya Mandiri",
  "PT Indo Logistik",
  "PT Bumi Persada",
  "CV Teknik Solusi",
  "PT Nusantara Supply",
];

function formatIDR(v: number) {
  return `Rp ${(v / 1e6).toLocaleString("id-ID")}M`;
}

const statusColors: Record<string, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  completed: "badge-info",
  draft: "badge-info",
  rejected: "badge-danger",
};

type StatusFilter = "all" | "approved" | "pending" | "completed" | "draft" | "rejected";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      order.po.toLowerCase().includes(query) || order.supplier.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleCreatePO() {
    if (!newSupplier || !newAmount || !newDescription.trim() || !newDate) return;
    const amount = Number(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    const maxNum = orders.reduce((max, o) => {
      const num = parseInt(o.po.split("-")[2], 10);
      return num > max ? num : max;
    }, 0);
    const nextNum = maxNum + 1;
    const poNumber = `PO-2024-${String(nextNum).padStart(3, "0")}`;

    const newOrder: Order = {
      po: poNumber,
      supplier: newSupplier,
      amount,
      status: "draft",
      date: newDate,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setNewSupplier("");
    setNewAmount("");
    setNewDescription("");
    setNewDate("");
    setShowModal(false);
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Purchase Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Manage your procurement orders
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Create PO
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search PO or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="input-field pl-10 pr-8 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Mobile: Card layout */}
      <div className="space-y-3 md:hidden">
        {filteredOrders.length === 0 && (
          <div className="widget-card text-center text-gray-400 py-8">
            No purchase orders found.
          </div>
        )}
        {filteredOrders.map((order) => (
          <div key={order.po} className="widget-card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-semibold text-primary-900 dark:text-white">{order.po}</span>
              <span className={cn("badge text-xs", statusColors[order.status])}>{order.status}</span>
            </div>
            <p className="text-sm text-gray-500">{order.supplier}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-primary-900 dark:text-white">{formatIDR(order.amount)}</span>
              <span className="text-xs text-gray-400">{order.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700/50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No purchase orders match your search or filter criteria.
                </td>
              </tr>
            )}
            {filteredOrders.map((order) => (
              <tr key={order.po} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors">
                <td className="py-4 px-6 font-mono text-sm font-medium text-primary-900 dark:text-white">{order.po}</td>
                <td className="py-4 px-6 text-sm text-gray-500">{order.supplier}</td>
                <td className="py-4 px-6 text-sm font-semibold text-primary-900 dark:text-white">{formatIDR(order.amount)}</td>
                <td className="py-4 px-6">
                  <span className={cn("badge", statusColors[order.status])}>{order.status}</span>
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass rounded-2xl border border-gray-200 dark:border-gray-700/50 w-full max-w-md p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900 dark:text-white">
                Create Purchase Order
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
                <select value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} className="input-field w-full">
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Amount (IDR)</label>
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="e.g. 150000000" className="input-field w-full" min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="e.g. Office supplies" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-field w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleCreatePO} className="btn-secondary">Create PO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
