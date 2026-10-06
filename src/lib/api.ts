import axios from "axios";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "./config";
import { NIFTY_STRATEGY } from "./constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem("authUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const getApiData = <T>(response: { data: { data: T } }): T =>
  response.data.data;

// Dashboard APIs
export const dashboardAPI = {
  getStats: (strategyName: string = NIFTY_STRATEGY) =>
    api.get("/instrument/dashboard-data", {
      params: { strategy_name: strategyName },
    }),
  getProfitLossChart: (period: string = "month") =>
    api.get(`/dashboard/profit-loss-chart?period=${period}`),
  generateToken: () => api.post("/dashboard/generate-token"),
};

// Stock APIs — default to Nifty 50 hedging universe
export const stockAPI = {
  getStocks: (
    page: number = 1,
    limit: number = 10,
    name: string = "NIFTY",
  ) =>
    api.get(`/instrument/stock-list`, {
      params: { pageIndex: page, pageSize: limit, name },
    }),
  makeasActive: (id: string) =>
    api.get(`/instrument/strike-active-deactive/${id}`),
  placeOrder: (data: {
    stockId: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
  }) => api.post("/stocks/place-order", data),
  /** Manual Nifty scalp test entry → Upstox (if live) + engine manages */
  placeManualNiftyEntry: (data: {
    hedging_option_id?: string;
    instrument_key?: string;
    lots: number;
    buy_price?: number;
  }) => api.post("/instrument/nifty-scalp/manual-entry", data),
  /** Morning cron: ensure records + chain + hedging */
  syncNiftyMorning: () => api.post("/instrument/nifty-scalp/sync-hedging"),
  syncNiftyFull: () => api.post("/instrument/nifty-scalp/sync-hedging"),
  syncNiftyChain: () => api.post("/instrument/nifty-scalp/sync-chain"),
  syncNiftyHedging: () => api.post("/instrument/nifty-scalp/sync-hedging"),
};

// Position APIs
export const positionAPI = {
  getCurrentPositions: (params?: {
    strategy_name?: string;
    active_only?: boolean;
  }) => api.get("/instrument/current-postions", { params }),
};

// Trade History APIs
export const tradeHistoryAPI = {
  getHistory: (options?: {
    fromDate?: string;
    toDate?: string;
    strategy_name?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.fromDate) params.append("fromDate", options.fromDate);
    if (options?.toDate) params.append("toDate", options.toDate);
    if (options?.strategy_name)
      params.append("strategy_name", options.strategy_name);
    return api.get(`/instrument/trade-history-list?${params.toString()}`);
  },
};

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/stock/login", { data: { email, password } }),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
};

// Nifty Options Scalp APIs (active strategy)
export const scalpingAPI = {
  getPerformance: (
    days: number = 30,
    strategyName: string = NIFTY_STRATEGY,
  ) =>
    api.get("/instrument/scalping-performance", {
      params: { days, strategy_name: strategyName },
    }),
  getStatus: () => api.get("/instrument/nifty-scalp/status"),
  getStrategyConfig: () => api.get("/instrument/nifty-scalp/config"),
  updateStrategyConfig: (payload: Record<string, unknown>) =>
    api.patch("/instrument/nifty-scalp/config", payload),
  /** Production ON/OFF — sets mode live/paper + user.is_live */
  toggleProduction: (production: boolean) =>
    api.post("/instrument/nifty-scalp/toggle-live", { production }),
  /** Alias kept for older callers */
  toggleLiveTrading: (production?: boolean) =>
    api.post("/instrument/nifty-scalp/toggle-live", {
      production: production ?? true,
    }),
  manualEntry: (data: {
    hedging_option_id?: string;
    instrument_key?: string;
    lots: number;
    buy_price?: number;
  }) => api.post("/instrument/nifty-scalp/manual-entry", data),
  getAuditLog: (params: {
    days?: number;
    action?: string;
    limit?: number;
  }) => api.get("/instrument/nifty-scalp/audit", { params }),
  runBacktest: (body: {
    startDate: string;
    endDate: string;
    signalType?: "CE" | "PE";
    instrumentType?: "CE" | "PE";
  }) => api.post("/instrument/scalping-backtest", body),
  runOptimize: (body: {
    days?: number;
    signalType?: "CE" | "PE";
    instrumentType?: "CE" | "PE";
    applyBest?: boolean;
    params?: string;
  }) => api.post("/instrument/scalping-optimize", body),
  /** Morning cron (nifty.chain.cron.ts): ensure + chain + hedging */
  syncNiftyMorning: () => api.post("/instrument/nifty-scalp/sync-hedging"),
  /** Chain only: ensure + syncNiftyOptionChain */
  syncNiftyChainOnly: () => api.post("/instrument/nifty-scalp/sync-chain"),
};

export default api;
