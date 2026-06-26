import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { positionAPI } from "@/lib/api";
import {
  StrategyFilterValue,
  strategyQueryParam,
} from "@/lib/tradeFormat";

export interface Position {
  id: string;
  symbol: string;
  buyPrice: number;
  currentLTP: number;
  quantity: number;
  profitLoss: number;
  netPl: number;
  charges: number;
  status: "in_trade" | "closed";
  entryDate: string;
  sellPrice: number;
  target: number;
  stopploss: number;
  highest_ltp?: number;
  strategy_name: string;
  instrument_type?: string;
  exit_reason?: string | null;
  trade_time: string;
}

interface PositionState {
  positions: Position[];
  strategyFilter: StrategyFilterValue;
  includeClosed: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PositionState = {
  positions: [],
  strategyFilter: "SCALLPING",
  includeClosed: false,
  loading: false,
  error: null,
};

export const fetchCurrentPositions = createAsyncThunk(
  "position/fetchCurrent",
  async (
    {
      strategyFilter,
      includeClosed,
    }: { strategyFilter: StrategyFilterValue; includeClosed: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await positionAPI.getCurrentPositions({
        strategy_name: strategyQueryParam(strategyFilter),
        active_only: !includeClosed,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch positions",
      );
    }
  },
);

const positionSlice = createSlice({
  name: "position",
  initialState,
  reducers: {
    setPositionStrategyFilter: (
      state,
      action: PayloadAction<StrategyFilterValue>,
    ) => {
      state.strategyFilter = action.payload;
    },
    setIncludeClosedPositions: (state, action: PayloadAction<boolean>) => {
      state.includeClosed = action.payload;
    },
    updatePositionFromSocket: (state, action) => {
      const updates = action.payload.data;
      if (!Array.isArray(updates)) return;

      const positionMap = new Map(state.positions.map((p) => [p.id, p]));
      updates.forEach((updated: Partial<Position> & { id: string }) => {
        if (positionMap.has(updated.id)) {
          Object.assign(positionMap.get(updated.id)!, updated);
        } else if (
          state.strategyFilter === "all" ||
          updated.strategy_name === state.strategyFilter
        ) {
          state.positions.push(updated as Position);
        }
      });
    },
    resetPositions: (state) => {
      state.positions = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload.data;
      })
      .addCase(fetchCurrentPositions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch positions";
      });
  },
});

export const {
  updatePositionFromSocket,
  resetPositions,
  setPositionStrategyFilter,
  setIncludeClosedPositions,
} = positionSlice.actions;
export default positionSlice.reducer;
