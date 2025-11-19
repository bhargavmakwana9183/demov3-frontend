import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardAPI } from "@/lib/api";

interface DashboardStats {
  monthlyProfitLoss: number;
  accountBalance: number;
  totalTrades: number;
  tralling_pl: number;
}

interface ChartData {
  month: string;
  profitLoss: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  chartData: ChartData[];
  loading: boolean;
  error: string | null;
  tokenGenerating: boolean;
}

const initialState: DashboardState = {
  stats: null,
  chartData: [],
  loading: false,
  error: null,
  tokenGenerating: false,
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => {
    const response = await dashboardAPI.getStats();
    return response.data;
  }
);

export const fetchProfitLossChart = createAsyncThunk(
  "dashboard/fetchChart",
  async (period: string = "month") => {
    const response = await dashboardAPI.getProfitLossChart(period);
    return response.data;
  }
);

export const generateToken = createAsyncThunk(
  "dashboard/generateToken",
  async () => {
    const response = await dashboardAPI.generateToken();
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch dashboard stats";
      })
      .addCase(fetchProfitLossChart.fulfilled, (state, action) => {
        state.chartData = action.payload;
      })
      .addCase(generateToken.pending, (state) => {
        state.tokenGenerating = true;
      })
      .addCase(generateToken.fulfilled, (state) => {
        state.tokenGenerating = false;
      })
      .addCase(generateToken.rejected, (state) => {
        state.tokenGenerating = false;
      });
  },
});

export default dashboardSlice.reducer;
