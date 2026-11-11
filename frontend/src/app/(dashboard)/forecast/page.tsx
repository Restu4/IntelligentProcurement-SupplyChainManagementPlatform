"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Play,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  api,
  type Budget,
  type ForecastHistoryItem,
  type ForecastResponse,
  type ForecastType,
  type SmartBuyResponse,
  type Supplier,
} from "@/lib/api";
import { cn, formatIDRCompact, formatRelativeTime } from "@/lib/utils";

const TYPES: { value: ForecastType; label: string }[] = [
  { value: "price", label: "Price forecast" },
  { value: "risk", label: "Supplier risk" },
  { value: "budget", label: "Budget health" },
];

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map(renderValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ForecastPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [history, setHistory] = useState<ForecastHistoryItem[]>([]);
  const [smartBuy, setSmartBuy] = useState<SmartBuyResponse | null>(null);
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<ForecastType>("price");
  const [supplierId, setSupplierId] = useState<string>("");
  const [budgetId, setBudgetId] = useState<string>("");
  const [prices, setPrices] = useState("120, 125, 118, 130, 135, 140");
  const [periods, setPeriods] = useState("3");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [supplierList, budgetPage, historyList, smartBuyResult] = await Promise.all([
        api.suppliers.list({ limit: 200 }),
        api.budgets.list({ limit: 200 }),
        api.forecast.history(10),
        api.forecast.smartBuy(),
      ]);
      setSuppliers(supplierList);
      setBudgets(budgetPage.items);
      setHistory(historyList);
      setSmartBuy(smartBuyResult);
      setSupplierId((current) => current || String(supplierList[0]?.id ?? ""));
      setBudgetId((current) => current || String(budgetPage.items[0]?.id ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forecast data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const payload =
        type === "price"
          ? {
              forecast_type: type,
              parameters: {
                historical_prices: prices
                  .split(",")
                  .map((value) => Number(value.trim()))
                  .filter((value) => Number.isFinite(value)),
                periods: Number(periods) || 3,
              },
            }
          : type === "risk"
            ? {
                forecast_type: type,
                supplier_id: Number(supplierId) || null,
                parameters: {},
              }
            : {
                forecast_type: type,
                parameters: { budget_id: Number(budgetId) || undefined },
              };

      const response = await api.forecast.create(payload);
      setResult(response);
      setHistory(await api.forecast.history(10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast failed");
    } finally {
      setRunning(false);
    }
  }

  const resultEntries = result ? Object.entries(result.result) : [];
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          AI Forecast
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Run forecasts against live supplier and budget data
        </p>
      </div>

      {error && (
        <div className="widget-card flex items-center gap-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-12">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading forecast data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="widget-card">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
                Run a Forecast
              </h3>
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Forecast type</span>
                  <select
                    className="input-field mt-1 w-full"
                    value={type}
                    onChange={(event) => setType(event.target.value as ForecastType)}
                  >
                    {TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {type === "price" && (
                  <>
                    <label className="block text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Historical prices (comma separated)
                      </span>
                      <input
                        className="input-field mt-1 w-full"
                        value={prices}
                        onChange={(event) => setPrices(event.target.value)}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Periods ahead</span>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        className="input-field mt-1 w-full"
                        value={periods}
                        onChange={(event) => setPeriods(event.target.value)}
                      />
                    </label>
                  </>
                )}

                {type === "risk" && (
                  <label className="block text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Supplier</span>
                    <select
                      className="input-field mt-1 w-full"
                      value={supplierId}
                      onChange={(event) => setSupplierId(event.target.value)}
                    >
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {type === "budget" && (
                  <label className="block text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Budget</span>
                    <select
                      className="input-field mt-1 w-full"
                      value={budgetId}
                      onChange={(event) => setBudgetId(event.target.value)}
                    >
                      {budgets.map((budget) => (
                        <option key={budget.id} value={budget.id}>
                          {budget.department} · {budget.fiscal_year} ·{" "}
                          {formatIDRCompact(budget.total_budget)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={() => void handleRun()}
                  disabled={running}
                >
                  {running ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {running ? "Running..." : "Run forecast"}
                </button>
                <p className="text-xs text-gray-400">
                  Demand forecasting is not available yet; the backend has no
                  historical demand series.
                </p>
              </div>
            </div>

            <div className="widget-card">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
                Latest Result
              </h3>
              {result ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-primary-800/50 px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Confidence
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        confidencePct >= 70
                          ? "text-green-600 dark:text-green-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      )}
                    >
                      {confidencePct}%
                    </span>
                  </div>
                  {resultEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 px-4 py-3"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-200 text-right break-all">
                        {renderValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run a forecast to see results here.
                </p>
              )}
            </div>
          </div>

          <div className="widget-card">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
                Smart Buy
              </h3>
            </div>
            {smartBuy?.top_supplier ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {smartBuy.recommendation}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gray-50 dark:bg-primary-800/50 p-3">
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="text-sm font-semibold text-primary-900 dark:text-white">
                      {smartBuy.top_supplier.name}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-primary-800/50 p-3">
                    <p className="text-xs text-gray-500">Composite score</p>
                    <p className="text-sm font-semibold text-primary-900 dark:text-white">
                      {smartBuy.top_supplier.score.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-primary-800/50 p-3">
                    <p className="text-xs text-gray-500">Delivery / Quality</p>
                    <p className="text-sm font-semibold text-primary-900 dark:text-white">
                      {smartBuy.top_supplier.delivery_score ?? "—"} /{" "}
                      {smartBuy.top_supplier.quality_score ?? "—"}
                    </p>
                  </div>
                </div>
                {smartBuy.all_scores && smartBuy.all_scores.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {smartBuy.all_scores.map((entry) => (
                      <span
                        key={entry.name}
                        className="badge badge-info text-xs"
                      >
                        {entry.name}: {entry.score.toFixed(2)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No active suppliers available for a recommendation.
              </p>
            )}
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary-500" />
              <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
                Forecast History
              </h3>
            </div>
            {history.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
                No forecasts have been run yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/30">
                      <th className="px-4 md:px-6 py-3 font-medium">Type</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Supplier</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Confidence</th>
                      <th className="px-4 md:px-6 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-primary-800/30">
                        <td className="px-4 md:px-6 py-3 capitalize text-primary-900 dark:text-white">
                          {item.forecast_type}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-500 dark:text-gray-400">
                          {suppliers.find((supplier) => supplier.id === item.supplier_id)?.name ?? "—"}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-500 dark:text-gray-400">
                          {item.confidence !== null
                            ? `${Math.round(item.confidence * 100)}%`
                            : "—"}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
