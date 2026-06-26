import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { tradeHistoryAPI } from "@/lib/api";
import {
  StrategyFilterValue,
  strategyQueryParam,
} from "@/lib/tradeFormat";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  strategy_name?: string;
  instrument_type?: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profitLoss: number;
  netPl: number;
  charges: number;
  duration: string;
  stopplose: number;
  target: number;
  exit_reason?: string | null;
  status: string;
}

interface TradeHistoryState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  strategyFilter: StrategyFilterValue;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

const initialState: TradeHistoryState = {
  trades: [],
  loading: false,
  error: null,
  strategyFilter: "SCALLPING",
  dateRange: {
    from: null,
    to: null,
  },
};

export const fetchTradeHistory = createAsyncThunk(
  "tradeHistory/fetch",
  async ({
    fromDate,
    toDate,
    strategyFilter,
  }: {
    fromDate?: string;
    toDate?: string;
    strategyFilter: StrategyFilterValue;
  }) => {
    const response = await tradeHistoryAPI.getHistory({
      fromDate,
      toDate,
      strategy_name: strategyQueryParam(strategyFilter),
    });
    return response.data;
  },
);

const tradeHistorySlice = createSlice({
  name: "tradeHistory",
  initialState,
  reducers: {
    setDateRange: (
      state,
      action: PayloadAction<{ from: string; to: string }>,
    ) => {
      state.dateRange = action.payload;
    },
    setHistoryStrategyFilter: (
      state,
      action: PayloadAction<StrategyFilterValue>,
    ) => {
      state.strategyFilter = action.payload;
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

export const { setDateRange, setHistoryStrategyFilter } =
  tradeHistorySlice.actions;
export default tradeHistorySlice.reducer;
