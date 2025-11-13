import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tradeHistoryAPI } from "@/lib/api";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profitLoss: number;
  duration: string;
  stopplose: number;
  target: number;
  status: "closed" | "exited";
}

interface TradeHistoryState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

const initialState: TradeHistoryState = {
  trades: [],
  loading: false,
  error: null,
  dateRange: {
    from: null,
    to: null,
  },
};

export const fetchTradeHistory = createAsyncThunk(
  "tradeHistory/fetch",
  async ({ fromDate, toDate }: { fromDate?: string; toDate?: string }) => {
    const response = await tradeHistoryAPI.getHistory(fromDate, toDate);
    return response.data;
  }
);

const tradeHistorySlice = createSlice({
  name: "tradeHistory",
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTradeHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradeHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.trades = action.payload.data;
      })
      .addCase(fetchTradeHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch trade history";
      });
  },
});

export const { setDateRange } = tradeHistorySlice.actions;
export default tradeHistorySlice.reducer;
