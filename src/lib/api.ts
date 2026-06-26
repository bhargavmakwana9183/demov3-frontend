import axios from "axios";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "./config";

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
  getStats: () => api.get("/instrument/dashboard-data"),
  getProfitLossChart: (period: string = "month") =>
    api.get(`/dashboard/profit-loss-chart?period=${period}`),
  generateToken: () => api.post("/dashboard/generate-token"),
};

// Stock APIs
export const stockAPI = {
  getStocks: (page: number = 1, limit: number = 10) =>
    api.get(`/instrument/stock-list?pageIndex=${page}&pageSize=${limit}`),
  makeasActive: (id: string) =>
    api.get(`/instrument/strike-active-deactive/${id}`),
  placeOrder: (data: {
    stockId: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
  }) => api.post("/stocks/place-order", data),
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

// Scalping APIs
export const scalpingAPI = {
  getPerformance: (days: number = 30, strategyName: string = "SCALLPING") =>
    api.get("/instrument/scalping-performance", {
      params: { days, strategy_name: strategyName },
    }),
  getStatus: () => api.get("/instrument/scalping-status"),
  getStrategyConfig: (strategyName: string = "SCALLPING") =>
    api.get("/instrument/strategy-config", {
      params: { strategy_name: strategyName },
    }),
  updateStrategyConfig: (payload: {
    mode?: "paper" | "live" | "backtest";
    strategy_name?: string;
  }) => api.patch("/instrument/strategy-config", payload),
  toggleLiveTrading: () =>
    api.get("/instrument/upstocks-order-place-toggle"),
  getAuditLog: (params: {
    days?: number;
    action?: string;
    limit?: number;
  }) =>
    api.get("/instrument/scalping-audit-log", { params }),
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
};

export default api;
