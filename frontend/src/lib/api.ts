/**
 * Typed client for the SmartProcure AI FastAPI backend.
 *
 * Base URL is configurable through NEXT_PUBLIC_API_URL (defaults to the local
 * development server). The access token and refresh token are kept in
 * localStorage; expired access tokens are refreshed transparently (single
 * flight) and the original request is retried once.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";

/* -------------------------------------------------------------------------- */
/*                                   Errors                                   */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function extractErrorMessage(status: number, body: unknown): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation errors: [{ loc, msg, type }]
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : String(item)
        )
        .join(", ");
    }
  }
  return `Request failed with status ${status}`;
}

/* -------------------------------------------------------------------------- */
/*                                   Tokens                                   */
/* -------------------------------------------------------------------------- */

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  save(tokens: Pick<TokenResponse, "access_token" | "refresh_token">): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, tokens.access_token);
    if (tokens.refresh_token) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  isAuthenticated(): boolean {
    return Boolean(tokenStore.get());
  },
};

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: string;
}

export interface SourceEvidence {
  document: string;
  chunk: string;
  score: number;
}

export interface ChatResponse {
  question: string;
  answer: string;
  sources: SourceEvidence[];
  confidence: number;
  /** True when the LLM was unavailable and the answer is an extractive fallback. */
  degraded?: boolean;
}

export interface ChatHistoryItem {
  id: number;
  question: string;
  answer: string;
  confidence: number | null;
  sources_json: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  description: string | null;
  chunk_count: number;
  created_at: string;
}

export interface DocumentUploadResponse {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  message: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  status: string;
  risk_level: string | null;
  delivery_score: number | null;
  quality_score: number | null;
  evaluation_notes: string | null;
  created_at: string;
}

export interface SupplierCreatePayload {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  status?: string;
  risk_level?: string;
  delivery_score?: number | null;
  quality_score?: number | null;
  evaluation_notes?: string;
}

export interface SupplierRisk {
  supplier_id: number;
  supplier_name: string;
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  factors: string[];
}

export type ForecastType = "price" | "risk" | "budget" | "demand";

export interface ForecastPayload {
  supplier_id?: number | null;
  forecast_type: ForecastType;
  parameters?: Record<string, unknown>;
}

export interface ForecastResponse {
  supplier_id: number | null;
  forecast_type: string;
  result: Record<string, unknown>;
  confidence: number;
}

export interface ForecastHistoryItem {
  id: number;
  supplier_id: number | null;
  forecast_type: string;
  parameters: string | null;
  result: string | null;
  confidence: number | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string | null;
  user_id: number;
  description: string | null;
  amount: number;
  status: string;
  approval_level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderPayload {
  supplier_id: number;
  description?: string | null;
  amount: number;
  notes?: string | null;
  status?: string;
  po_number?: string | null;
}

export interface PurchaseOrderUpdatePayload {
  supplier_id?: number;
  description?: string | null;
  amount?: number;
  notes?: string | null;
  status?: string;
}

export interface Budget {
  id: number;
  department: string;
  fiscal_year: number;
  total_budget: number;
  allocated: number;
  remaining: number;
  utilization: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetPayload {
  department: string;
  fiscal_year: number;
  total_budget: number;
  allocated: number;
}

export interface BudgetUpdatePayload {
  department?: string;
  fiscal_year?: number;
  total_budget?: number;
  allocated?: number;
}

export interface BudgetSummary {
  fiscal_year: number;
  departments: number;
  total_budget: number;
  allocated: number;
  remaining: number;
  utilization: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface SmartBuyResponse {
  recommendation: string;
  top_supplier: {
    name: string;
    score: number;
    delivery_score: number | null;
    quality_score: number | null;
  } | null;
  all_scores?: { name: string; score: number }[];
}

export interface HealthResponse {
  status: string;
  version: string;
  database: string;
  chromadb: string;
  gemini: string;
  embedding_model: string | null;
}

/* ---------------------------------- Analytics ----------------------------- */

export interface AnalyticsTotals {
  total_budget: number;
  allocated: number;
  remaining: number;
  utilization: number;
  /** Approved + completed purchase orders only. */
  spend: number;
  pending_amount: number;
  purchase_orders: number;
  avg_order_value: number;
  active_suppliers: number;
  high_risk_suppliers: number;
  documents: number;
  pending_pos: number;
  completed_pos: number;
}

export interface MonthlyPoint {
  month: string;
  month_number: number;
  orders: number;
  spend: number;
}

export interface CategorySpend {
  category: string;
  spend: number;
  share: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface AnalyticsOverview {
  fiscal_year: number;
  totals: AnalyticsTotals;
  monthly: MonthlyPoint[];
  categories: CategorySpend[];
  status_breakdown: StatusBreakdown[];
  generated_at: string;
}

/* ---------------------------------- Reports ------------------------------- */

export interface ReportBudgetRow {
  department: string;
  fiscal_year: number;
  total_budget: number;
  allocated: number;
  remaining: number;
  utilization: number;
}

export interface ReportSupplierRow {
  name: string;
  category: string | null;
  status: string;
  risk_level: string | null;
  delivery_score: number | null;
  quality_score: number | null;
}

export interface ReportPurchaseOrderRow {
  po_number: string;
  supplier_name: string | null;
  amount: number;
  status: string;
  approval_level: string | null;
  created_at: string;
}

export interface ReportSummary {
  fiscal_year: number;
  generated_at: string;
  totals: AnalyticsTotals;
  budgets: ReportBudgetRow[];
  suppliers: ReportSupplierRow[];
  purchase_orders: ReportPurchaseOrderRow[];
}

/* ----------------------------------- Audit -------------------------------- */

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Request                                   */
/* -------------------------------------------------------------------------- */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Exchange the stored refresh token for a new pair.
 *
 * A module-level promise makes this single-flight: a dashboard that fires six
 * parallel requests when the access token expires performs one refresh, not
 * six (which would trip reuse detection on the backend).
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
          cache: "no-store",
        });
        if (!response.ok) {
          tokenStore.clear();
          return null;
        }
        const tokens = (await response.json()) as TokenResponse;
        tokenStore.save(tokens);
        return tokens.access_token;
      } catch {
        // Network failure: keep the tokens so a later retry can succeed.
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, headers = {}, signal } = options;

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = tokenStore.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const send = async (): Promise<Response> => {
    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: finalHeaders,
        body: payload,
        signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new ApiError(
        `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`,
        0,
        error
      );
    }
  };

  let response = await send();

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      finalHeaders.Authorization = `Bearer ${refreshed}`;
      response = await send();
    } else {
      tokenStore.clear();
    }
  }

  if (!response.ok) {
    let parsed: unknown = undefined;
    const text = await response.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    throw new ApiError(
      extractErrorMessage(response.status, parsed),
      response.status,
      parsed
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/* -------------------------------------------------------------------------- */
/*                                    API                                     */
/* -------------------------------------------------------------------------- */

export const api = {
  auth: {
    login(username: string, password: string): Promise<TokenResponse> {
      return request<TokenResponse>("/api/login", {
        method: "POST",
        body: { username, password },
        auth: false,
      });
    },
    register(payload: RegisterPayload): Promise<User> {
      return request<User>("/api/register", {
        method: "POST",
        body: payload,
        auth: false,
      });
    },
    me(): Promise<User> {
      return request<User>("/api/me");
    },
    logout(): Promise<void> {
      const refreshToken = tokenStore.getRefresh();
      tokenStore.clear();
      if (!refreshToken) return Promise.resolve();
      // Best effort: the local session is already gone even if this fails.
      return request<void>("/api/logout", {
        method: "POST",
        body: { refresh_token: refreshToken },
        auth: false,
      }).catch(() => undefined);
    },
  },

  chat: {
    send(question: string, signal?: AbortSignal): Promise<ChatResponse> {
      return request<ChatResponse>("/api/chat", {
        method: "POST",
        body: { question },
        signal,
      });
    },
    history(limit = 20): Promise<ChatHistoryItem[]> {
      return request<ChatHistoryItem[]>(`/api/history${buildQuery({ limit })}`);
    },
  },

  documents: {
    list(): Promise<DocumentItem[]> {
      return request<DocumentItem[]>("/api/documents");
    },
    get(id: number): Promise<DocumentItem> {
      return request<DocumentItem>(`/api/documents/${id}`);
    },
    upload(file: File, description?: string): Promise<DocumentUploadResponse> {
      const form = new FormData();
      form.append("file", file);
      if (description) form.append("description", description);
      return request<DocumentUploadResponse>("/api/upload", {
        method: "POST",
        body: form,
      });
    },
    remove(id: number): Promise<void> {
      return request<void>(`/api/documents/${id}`, { method: "DELETE" });
    },
  },

  suppliers: {
    list(filters?: {
      status?: string;
      risk_level?: string;
      category?: string;
      q?: string;
      limit?: number;
      offset?: number;
    }): Promise<Supplier[]> {
      return request<Supplier[]>(`/api/suppliers${buildQuery(filters)}`);
    },
    get(id: number): Promise<Supplier> {
      return request<Supplier>(`/api/suppliers/${id}`);
    },
    create(payload: SupplierCreatePayload): Promise<Supplier> {
      return request<Supplier>("/api/suppliers", { method: "POST", body: payload });
    },
    risk(id: number): Promise<SupplierRisk> {
      return request<SupplierRisk>(`/api/suppliers/${id}/risk`);
    },
  },

  purchaseOrders: {
    list(params?: {
      status?: string;
      supplier_id?: number;
      q?: string;
      limit?: number;
      offset?: number;
    }): Promise<Page<PurchaseOrder>> {
      return request<Page<PurchaseOrder>>(
        `/api/purchase-orders${buildQuery(params)}`
      );
    },
    get(id: number): Promise<PurchaseOrder> {
      return request<PurchaseOrder>(`/api/purchase-orders/${id}`);
    },
    create(payload: PurchaseOrderPayload): Promise<PurchaseOrder> {
      return request<PurchaseOrder>("/api/purchase-orders", {
        method: "POST",
        body: payload,
      });
    },
    update(
      id: number,
      payload: PurchaseOrderUpdatePayload
    ): Promise<PurchaseOrder> {
      return request<PurchaseOrder>(`/api/purchase-orders/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    remove(id: number): Promise<void> {
      return request<void>(`/api/purchase-orders/${id}`, { method: "DELETE" });
    },
  },

  budgets: {
    list(params?: {
      fiscal_year?: number;
      department?: string;
      limit?: number;
      offset?: number;
    }): Promise<Page<Budget>> {
      return request<Page<Budget>>(`/api/budgets${buildQuery(params)}`);
    },
    summary(fiscal_year?: number): Promise<BudgetSummary> {
      return request<BudgetSummary>(
        `/api/budgets/summary${buildQuery({ fiscal_year })}`
      );
    },
    get(id: number): Promise<Budget> {
      return request<Budget>(`/api/budgets/${id}`);
    },
    create(payload: BudgetPayload): Promise<Budget> {
      return request<Budget>("/api/budgets", { method: "POST", body: payload });
    },
    update(id: number, payload: BudgetUpdatePayload): Promise<Budget> {
      return request<Budget>(`/api/budgets/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    remove(id: number): Promise<void> {
      return request<void>(`/api/budgets/${id}`, { method: "DELETE" });
    },
  },

  forecast: {
    create(payload: ForecastPayload): Promise<ForecastResponse> {
      return request<ForecastResponse>("/api/forecast", {
        method: "POST",
        body: payload,
      });
    },
    history(limit = 20): Promise<ForecastHistoryItem[]> {
      return request<ForecastHistoryItem[]>(`/api/forecast${buildQuery({ limit })}`);
    },
    smartBuy(): Promise<SmartBuyResponse> {
      return request<SmartBuyResponse>("/api/forecast/smart-buy");
    },
  },

  analytics: {
    overview(fiscal_year?: number): Promise<AnalyticsOverview> {
      return request<AnalyticsOverview>(
        `/api/analytics/overview${buildQuery({ fiscal_year })}`
      );
    },
  },

  reports: {
    summary(fiscal_year?: number): Promise<ReportSummary> {
      return request<ReportSummary>(
        `/api/reports/summary${buildQuery({ fiscal_year })}`
      );
    },
  },

  audit: {
    list(params?: {
      action?: string;
      entity_type?: string;
      user_id?: number;
      limit?: number;
      offset?: number;
    }): Promise<Page<AuditLogItem>> {
      return request<Page<AuditLogItem>>(`/api/audit-logs${buildQuery(params)}`);
    },
  },

  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health", { auth: false });
  },
};

export default api;
