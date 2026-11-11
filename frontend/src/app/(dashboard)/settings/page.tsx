"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ScrollText,
  Settings,
  Shield,
  User,
} from "lucide-react";
import {
  api,
  ApiError,
  type AuditLogItem,
  type HealthResponse,
  type User as ApiUser,
} from "@/lib/api";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

const ENTITY_FILTERS = [
  "all",
  "auth",
  "purchase_order",
  "budget",
  "supplier",
  "document",
  "user",
] as const;

const PAGE_SIZE = 20;

function statusTone(value: string | null | undefined): string {
  const normalised = (value ?? "").toLowerCase();
  if (["connected", "configured", "healthy"].includes(normalised)) {
    return "text-green-600 dark:text-green-400";
  }
  if (["disconnected", "not configured", "unhealthy"].includes(normalised)) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-gray-500 dark:text-gray-400";
}

export default function SettingsPage() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [audit, setAudit] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditEntity, setAuditEntity] = useState<(typeof ENTITY_FILTERS)[number]>("all");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [me, status] = await Promise.all([api.auth.me(), api.health()]);
        if (cancelled) return;
        setUser(me);
        setHealth(status);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 401
            ? "Your session has expired. Please sign in again."
            : err instanceof Error
              ? err.message
              : "Failed to load settings"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAudit = useCallback(async () => {
    if (!isAdmin) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const page = await api.audit.list({
        limit: PAGE_SIZE,
        offset: auditOffset,
        entity_type: auditEntity === "all" ? undefined : auditEntity,
      });
      setAudit(page.items);
      setAuditTotal(page.total);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setAuditLoading(false);
    }
  }, [isAdmin, auditOffset, auditEntity]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const canGoBack = auditOffset > 0;
  const canGoForward = auditOffset + PAGE_SIZE < auditTotal;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <Settings className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Account details, system status and the audit trail
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
          Loading settings...
        </div>
      ) : (
        <>
          <div className="widget-card">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
                  Account
                </h3>
                <p className="text-xs md:text-sm text-gray-500">
                  Read directly from the authenticated session
                </p>
              </div>
            </div>
            {user ? (
              <div className="space-y-3">
                {[
                  ["Username", user.username],
                  ["Full Name", user.full_name || "-"],
                  ["Email", user.email],
                  ["Role", user.role],
                  ["Status", user.is_active ? "Active" : "Deactivated"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-2"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Account information is unavailable.
              </p>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Profile editing is not exposed by the API yet; ask an administrator to
              change roles or account status.
            </p>
          </div>

          <div className="widget-card">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
                  System Status
                </h3>
                <p className="text-xs md:text-sm text-gray-500">
                  Live health check from the backend
                </p>
              </div>
            </div>
            {health ? (
              <div className="space-y-3">
                {[
                  ["Backend", health.status],
                  ["Version", health.version],
                  ["Database", health.database],
                  ["Vector store", health.chromadb],
                  ["Gemini", health.gemini],
                  ["Embedding model", health.embedding_model ?? "unknown"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-2"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <span className={cn("text-sm break-all sm:text-right", statusTone(value))}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Health information is unavailable.
              </p>
            )}
          </div>

          <div className="widget-card">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
                  Session Security
                </h3>
                <p className="text-xs md:text-sm text-gray-500">
                  Access and refresh token policy
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["Access token", "Short-lived bearer token"],
                ["Refresh token", "Rotated on every refresh; reuse revokes the session"],
                ["Rate limiting", "Applied per client IP by the API"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-primary-800/50 gap-2"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="widget-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-primary-800 flex items-center justify-center shrink-0">
                  <ScrollText className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white">
                    Audit Log
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">
                    {isAdmin
                      ? `${auditTotal} recorded event${auditTotal === 1 ? "" : "s"}`
                      : "Administrators only"}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <select
                  className="input-field py-2 pr-8 text-sm"
                  value={auditEntity}
                  onChange={(event) => {
                    setAuditEntity(event.target.value as (typeof ENTITY_FILTERS)[number]);
                    setAuditOffset(0);
                  }}
                >
                  {ENTITY_FILTERS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All entities" : option}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!isAdmin ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign in with an administrator account to view the audit trail.
              </p>
            ) : auditError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{auditError}</p>
            ) : auditLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading audit log...
              </div>
            ) : audit.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No audit events recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/30">
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium">User</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                      <th className="px-3 py-2 font-medium">Entity</th>
                      <th className="px-3 py-2 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
                    {audit.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-primary-800/30">
                        <td
                          className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap"
                          title={formatDate(item.created_at, { dateStyle: "medium", timeStyle: "medium" })}
                        >
                          {formatRelativeTime(item.created_at)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                          {item.username ?? "-"}
                        </td>
                        <td className="px-3 py-2 font-medium text-primary-900 dark:text-white">
                          {item.action}
                        </td>
                        <td
                          className="px-3 py-2 text-gray-500 dark:text-gray-400"
                          title={item.detail ?? undefined}
                        >
                          {item.entity_type ?? "-"}
                          {item.entity_id ? ` #${item.entity_id}` : ""}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                          {item.ip_address ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-400">
                    {auditOffset + 1}–{Math.min(auditOffset + PAGE_SIZE, auditTotal)} of{" "}
                    {auditTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-outline text-xs flex items-center gap-1"
                      onClick={() => setAuditOffset((value) => Math.max(0, value - PAGE_SIZE))}
                      disabled={!canGoBack || auditLoading}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>
                    <button
                      className="btn-outline text-xs flex items-center gap-1"
                      onClick={() => setAuditOffset((value) => value + PAGE_SIZE)}
                      disabled={!canGoForward || auditLoading}
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
