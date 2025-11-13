import axios from "axios";

const API_BASE_URL = "https://stockmaster.babydatingx.in/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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
  placeOrder: (data: {
    stockId: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
  }) => api.post("/stocks/place-order", data),
};

// Position APIs
export const positionAPI = {
  getCurrentPositions: () => api.get("/instrument/current-postions"),
};

// Trade History APIs
export const tradeHistoryAPI = {
  getHistory: (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
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

export default api;
