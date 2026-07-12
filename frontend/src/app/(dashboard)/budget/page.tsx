"use client";

import { useState } from "react";
import { Wallet, AlertCircle, Search, Filter, Plus, X } from "lucide-react";

interface Department {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
}

const initialDepartments: Department[] = [
  { name: "IT Infrastructure", budget: 25000000000, spent: 18500000000, remaining: 6500000000 },
  { name: "Raw Materials", budget: 45000000000, spent: 42000000000, remaining: 3000000000 },
  { name: "Logistics", budget: 20000000000, spent: 15000000000, remaining: 5000000000 },
  { name: "Office Equipment", budget: 10000000000, spent: 3500000000, remaining: 6500000000 },
  { name: "Consulting Services", budget: 15000000000, spent: 12000000000, remaining: 3000000000 },
  { name: "Maintenance", budget: 12000000000, spent: 8000000000, remaining: 4000000000 },
];

function formatIDR(v: number) {
  return `Rp ${(v / 1e6).toLocaleString("id-ID")}M`;
}

type FilterLevel = "all" | "high-risk" | "warning" | "healthy";

export default function BudgetPage() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [showModal, setShowModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptBudget, setNewDeptBudget] = useState("");

  const totalBudget = departments.reduce((s, d) => s + d.budget, 0);
  const totalSpent = departments.reduce((s, d) => s + d.spent, 0);
  const totalRemaining = departments.reduce((s, d) => s + d.remaining, 0);

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase());
    const pct = (dept.spent / dept.budget) * 100;
    let matchesFilter = true;
    if (filterLevel === "high-risk") matchesFilter = pct > 85;
    else if (filterLevel === "warning") matchesFilter = pct > 70 && pct <= 85;
    else if (filterLevel === "healthy") matchesFilter = pct <= 70;
    return matchesSearch && matchesFilter;
  });

  function handleAddDepartment() {
    if (!newDeptName.trim() || !newDeptBudget.trim()) return;
    const budget = Number(newDeptBudget);
    if (isNaN(budget) || budget <= 0) return;
    setDepartments((prev) => [...prev, { name: newDeptName.trim(), budget, spent: 0, remaining: budget }]);
    setNewDeptName("");
    setNewDeptBudget("");
    setShowModal(false);
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          Budget Tracker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Monitor your procurement budget allocation across departments
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Total Budget</p><p className="text-lg md:text-2xl font-bold text-primary-900 dark:text-white">{formatIDR(totalBudget)}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Total Spent</p><p className="text-lg md:text-2xl font-bold text-accent-500">{formatIDR(totalSpent)}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Remaining</p><p className="text-lg md:text-2xl font-bold text-secondary-500">{formatIDR(totalRemaining)}</p></div>
        <div className="widget-card"><p className="text-xs md:text-sm text-gray-500">Utilization</p><p className="text-lg md:text-2xl font-bold text-yellow-500">{((totalSpent / totalBudget) * 100).toFixed(1)}%</p></div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-10" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as FilterLevel)} className="input-field pl-10 pr-8 appearance-none cursor-pointer">
            <option value="all">All Levels</option>
            <option value="high-risk">High Risk (&gt;85%)</option>
            <option value="warning">Warning (70-85%)</option>
            <option value="healthy">Healthy (&lt;70%)</option>
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-secondary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Budget
        </button>
      </div>

      <div className="glass rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">Department Budget Allocation</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
          {filteredDepartments.length === 0 && <div className="p-6 text-center text-gray-400">No departments match your criteria.</div>}
          {filteredDepartments.map((dept) => {
            const pct = (dept.spent / dept.budget) * 100;
            return (
              <div key={dept.name} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary-900 dark:text-white truncate">{dept.name}</p>
                    <p className="text-xs md:text-sm text-gray-500">{formatIDR(dept.spent)} of {formatIDR(dept.budget)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-base md:text-lg font-bold text-primary-900 dark:text-white">{formatIDR(dept.remaining)}</p>
                    <p className="text-xs text-gray-400">remaining</p>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct > 85 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-secondary-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-400">{pct.toFixed(1)}% utilized</span>
                  {pct > 85 && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Over budget risk</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass rounded-2xl border border-gray-200 dark:border-gray-700/50 w-full max-w-md p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900 dark:text-white">Add Budget Allocation</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Department Name</label>
                <input type="text" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Marketing" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Budget Amount (IDR)</label>
                <input type="number" value={newDeptBudget} onChange={(e) => setNewDeptBudget(e.target.value)} placeholder="e.g. 10000000000" className="input-field w-full" min={0} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleAddDepartment} className="btn-secondary">Add Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
