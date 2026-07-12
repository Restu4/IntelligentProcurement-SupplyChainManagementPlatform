"use client";

import { useState } from "react";
import { Building2, Search, Plus, MoreHorizontal, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_SUPPLIERS = [
  { id: 1, name: "PT Surya Pratama", category: "Raw Materials", status: "active", risk: "low", deliveryScore: 95, qualityScore: 92, contracts: 12 },
  { id: 2, name: "PT Indo Logistik", category: "Logistics", status: "active", risk: "medium", deliveryScore: 78, qualityScore: 80, contracts: 8 },
  { id: 3, name: "PT Maju Jaya", category: "Equipment", status: "active", risk: "low", deliveryScore: 88, qualityScore: 85, contracts: 10 },
  { id: 4, name: "CV Sukses Abadi", category: "Services", status: "active", risk: "low", deliveryScore: 91, qualityScore: 93, contracts: 6 },
  { id: 5, name: "PT Karya Mandiri", category: "Raw Materials", status: "active", risk: "low", deliveryScore: 93, qualityScore: 94, contracts: 15 },
  { id: 6, name: "PT Bumi Persada", category: "Logistics", status: "active", risk: "high", deliveryScore: 68, qualityScore: 72, contracts: 4 },
  { id: 7, name: "CV Teknik Solusi", category: "Equipment", status: "inactive", risk: "medium", deliveryScore: 82, qualityScore: 78, contracts: 3 },
  { id: 8, name: "PT Nusantara Supply", category: "Raw Materials", status: "active", risk: "low", deliveryScore: 96, qualityScore: 91, contracts: 18 },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Raw Materials", status: "active" as "active" | "inactive" });

  const filtered = suppliers.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesRisk = riskFilter === "all" || s.risk === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  function handleAddSupplier() {
    if (!form.name.trim()) return;
    const newSupplier = {
      id: Math.max(...suppliers.map((s) => s.id)) + 1,
      name: form.name.trim(),
      category: form.category,
      status: form.status,
      risk: "low" as const,
      deliveryScore: Math.floor(Math.random() * 20) + 75,
      qualityScore: Math.floor(Math.random() * 20) + 75,
      contracts: 0,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    setForm({ name: "", category: "Raw Materials", status: "active" });
    setShowModal(false);
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-primary-800 rounded-2xl p-5 md:p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white">Add New Supplier</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-700">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Company Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. PT Maju Bersama" className="input-field" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  <option>Raw Materials</option>
                  <option>Logistics</option>
                  <option>Equipment</option>
                  <option>Services</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleAddSupplier} disabled={!form.name.trim()} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
                <Check className="w-4 h-4" /> Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Supplier Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage and evaluate your supplier ecosystem</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-secondary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Total Suppliers</p><p className="text-xl md:text-2xl font-bold text-primary-900 dark:text-white">{suppliers.length}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Active</p><p className="text-xl md:text-2xl font-bold text-green-500">{suppliers.filter((s) => s.status === "active").length}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">High Risk</p><p className="text-xl md:text-2xl font-bold text-red-500">{suppliers.filter((s) => s.risk === "high").length}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Avg Performance</p><p className="text-xl md:text-2xl font-bold text-secondary-500">{(suppliers.reduce((s, x) => s + (x.deliveryScore + x.qualityScore) / 2, 0) / suppliers.length).toFixed(1)}%</p></div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="input-field pl-10" />
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field flex-1 sm:flex-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="input-field flex-1 sm:flex-none">
            <option value="all">All Risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Mobile: Card layout */}
      <div className="space-y-3 md:hidden">
        {filtered.map((supplier) => (
          <div key={supplier.id} className="widget-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">{supplier.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary-900 dark:text-white truncate">{supplier.name}</p>
                <p className="text-xs text-gray-400">{supplier.category} &middot; {supplier.contracts} contracts</p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("badge text-xs", supplier.status === "active" ? "badge-success" : "badge-warning")}>{supplier.status}</span>
              <span className={cn("badge text-xs", supplier.risk === "low" ? "badge-success" : supplier.risk === "medium" ? "badge-warning" : "badge-danger")}>{supplier.risk} risk</span>
              <span className="text-xs text-gray-400 ml-auto">D:{supplier.deliveryScore}% Q:{supplier.qualityScore}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700/50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivery</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quality</th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white font-semibold text-sm">{supplier.name.charAt(0)}</div>
                    <div><p className="font-semibold text-primary-900 dark:text-white">{supplier.name}</p><p className="text-xs text-gray-400">{supplier.contracts} contracts</p></div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{supplier.category}</td>
                <td className="py-4 px-6"><span className={cn("badge", supplier.status === "active" ? "badge-success" : "badge-warning")}>{supplier.status}</span></td>
                <td className="py-4 px-6"><span className={cn("badge", supplier.risk === "low" ? "badge-success" : supplier.risk === "medium" ? "badge-warning" : "badge-danger")}>{supplier.risk}</span></td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-20"><div className={cn("h-full rounded-full transition-all", supplier.deliveryScore >= 80 ? "bg-green-500" : supplier.deliveryScore >= 60 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${supplier.deliveryScore}%` }} /></div><span className="text-xs font-medium text-gray-500">{supplier.deliveryScore}%</span></div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-20"><div className={cn("h-full rounded-full transition-all", supplier.qualityScore >= 80 ? "bg-green-500" : supplier.qualityScore >= 60 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${supplier.qualityScore}%` }} /></div><span className="text-xs font-medium text-gray-500">{supplier.qualityScore}%</span></div>
                </td>
                <td className="py-4 px-6 text-right"><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
