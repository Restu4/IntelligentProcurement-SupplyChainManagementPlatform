"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Wallet, AlertCircle, Search, Filter, Plus, X, Loader2 } from "lucide-react";
import {
  api,
  ApiError,
  type Budget,
  type BudgetSummary,
} from "@/lib/api";
import { cn, formatIDR } from "@/lib/utils";

type FilterLevel = "all" | "high-risk" | "warning" | "healthy";

interface FormState {
  department: string;
  fiscal_year: string;
  total_budget: string;
  allocated: string;
}

const EMPTY_FORM: FormState = {
  department: "",
  fiscal_year: "",
  total_budget: "",
  allocated: "0",
};

function levelFor(utilization: number): FilterLevel {
  if (utilization > 85) return "high-risk";
  if (utilization > 70) return "warning";
  return "healthy";
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------ bootstrap ------------------------------- */

  useEffect(() => {
    void api.auth
      .me()
      .then((user) => setIsAdmin(user.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api.budgets
      .list({ limit: 200 })
      .then((page) => {
        if (cancelled) return;
        const available = Array.from(new Set(page.items.map((item) => item.fiscal_year))).sort(
          (a, b) => b - a
        );
        setYears(available);
        setYear((current) => current ?? available[0] ?? new Date().getFullYear());
      })
      .catch(() => {
        if (!cancelled) setYear(new Date().getFullYear());
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (year === null) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [page, aggregate] = await Promise.all([
          api.budgets.list({ fiscal_year: year as number, limit: 200 }),
          api.budgets.summary(year as number),
        ]);
        if (cancelled) return;
        setBudgets(page.items);
        setSummary(aggregate);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load budgets.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [year, reloadKey]);

  /* -------------------------------- derived -------------------------------- */

  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return budgets.filter((budget) => {
      const matchesSearch = !term || budget.department.toLowerCase().includes(term);
      const matchesFilter =
        filterLevel === "all" || levelFor(budget.utilization) === filterLevel;
      return matchesSearch && matchesFilter;
    });
  }, [budgets, searchQuery, filterLevel]);

  const totals = useMemo(() => {
    if (summary) return summary;
    const totalBudget = budgets.reduce((sum, item) => sum + item.total_budget, 0);
    const allocated = budgets.reduce((sum, item) => sum + item.allocated, 0);
    return {
      fiscal_year: year ?? 0,
      departments: budgets.length,
      total_budget: totalBudget,
      allocated,
      remaining: totalBudget - allocated,
      utilization: totalBudget > 0 ? (allocated / totalBudget) * 100 : 0,
    } satisfies BudgetSummary;
  }, [summary, budgets, year]);

  /* -------------------------------- actions -------------------------------- */

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, fiscal_year: String(year ?? new Date().getFullYear()) });
    setShowModal(true);
  }

  function openEdit(budget: Budget) {
    setEditing(budget);
    setForm({
      department: budget.department,
      fiscal_year: String(budget.fiscal_year),
      total_budget: String(budget.total_budget),
      allocated: String(budget.allocated),
    });
    setShowModal(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const totalBudget = Number(form.total_budget);
    const allocated = Number(form.allocated);
    const fiscalYear = Number(form.fiscal_year);

    if (!form.department.trim() || !Number.isFinite(totalBudget) || totalBudget <= 0) {
      setError("Department and a positive total budget are required.");
      return;
    }
    if (!Number.isFinite(allocated) || allocated < 0 || allocated > totalBudget) {
      setError("Allocated amount must be between 0 and the total budget.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await api.budgets.update(editing.id, {
          department: form.department.trim(),
          fiscal_year: fiscalYear,
          total_budget: totalBudget,
          allocated,
        });
        setNotice(`${form.department} budget updated.`);
      } else {
        await api.budgets.create({
          department: form.department.trim(),
          fiscal_year: fiscalYear,
          total_budget: totalBudget,
          allocated,
        });
        setNotice(`${form.department} budget created.`);
      }
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the budget.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeBudget(budget: Budget) {
    if (!window.confirm(`Delete the ${budget.department} budget for ${budget.fiscal_year}?`)) {
      return;
    }
    setError(null);
    try {
      await api.budgets.remove(budget.id);
      setNotice(`${budget.department} budget deleted.`);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
            Budget Tracker
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Live allocation data from the procurement database
          </p>
        </div>
        <div className="flex items-center gap-2">
          {years.length > 0 && (
            <select
              value={year ?? ""}
              onChange={(event) => setYear(Number(event.target.value))}
              className="input-field w-auto cursor-pointer"
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  FY {value}
                </option>
              ))}
            </select>
          )}
          {isAdmin && (
            <button onClick={openCreate} className="btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Budget
            </button>
          )}
        </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Total Budget</p>
          <p className="text-lg md:text-2xl font-bold text-primary-900 dark:text-white">
            {formatIDR(totals.total_budget)}
          </p>
        </div>
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Allocated</p>
          <p className="text-lg md:text-2xl font-bold text-accent-500">
            {formatIDR(totals.allocated)}
          </p>
        </div>
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Remaining</p>
          <p className="text-lg md:text-2xl font-bold text-secondary-500">
            {formatIDR(totals.remaining)}
          </p>
        </div>
        <div className="widget-card">
          <p className="text-xs md:text-sm text-gray-500">Utilization</p>
          <p className="text-lg md:text-2xl font-bold text-yellow-500">
            {totals.utilization.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterLevel}
            onChange={(event) => setFilterLevel(event.target.value as FilterLevel)}
            className="input-field pl-10 pr-8 appearance-none cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="high-risk">High Risk (&gt;85%)</option>
            <option value="warning">Warning (70-85%)</option>
            <option value="healthy">Healthy (&lt;70%)</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
            Department Budget Allocation
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading budgets...
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-400">
                No departments match your criteria.
              </div>
            )}
            {filtered.map((budget) => {
              const level = levelFor(budget.utilization);
              return (
                <div
                  key={budget.id}
                  className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-primary-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary-900 dark:text-white truncate">
                        {budget.department}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        {formatIDR(budget.allocated)} of {formatIDR(budget.total_budget)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-base md:text-lg font-bold text-primary-900 dark:text-white">
                        {formatIDR(budget.remaining)}
                      </p>
                      <p className="text-xs text-gray-400">remaining</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        level === "high-risk"
                          ? "bg-red-500"
                          : level === "warning"
                          ? "bg-yellow-500"
                          : "bg-secondary-500"
                      )}
                      style={{ width: `${Math.min(100, budget.utilization)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">
                      {budget.utilization.toFixed(1)}% utilized
                    </span>
                    <div className="flex items-center gap-3">
                      {level === "high-risk" && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />Over budget risk
                        </span>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(budget)}
                            className="text-xs font-medium text-secondary-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeBudget(budget)}
                            className="text-xs font-medium text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="glass rounded-2xl border border-gray-200 dark:border-gray-700/50 w-full max-w-md p-5 md:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900 dark:text-white">
                {editing ? `Edit ${editing.department}` : "Add Budget Allocation"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Department Name</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(event) => setForm({ ...form, department: event.target.value })}
                  placeholder="e.g. Marketing"
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Fiscal Year</label>
                <input
                  type="number"
                  value={form.fiscal_year}
                  onChange={(event) => setForm({ ...form, fiscal_year: event.target.value })}
                  className="input-field w-full"
                  min={2000}
                  max={2100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Total Budget (IDR)</label>
                <input
                  type="number"
                  value={form.total_budget}
                  onChange={(event) => setForm({ ...form, total_budget: event.target.value })}
                  placeholder="e.g. 10000000000"
                  className="input-field w-full"
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Allocated (IDR)</label>
                <input
                  type="number"
                  value={form.allocated}
                  onChange={(event) => setForm({ ...form, allocated: event.target.value })}
                  className="input-field w-full"
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-secondary disabled:opacity-50">
                {submitting ? "Saving..." : editing ? "Save Changes" : "Add Department"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
