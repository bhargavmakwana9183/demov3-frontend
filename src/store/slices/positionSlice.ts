import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { positionAPI } from "@/lib/api";
import {
  StrategyFilterValue,
  strategyQueryParam,
} from "@/lib/tradeFormat";

export interface Position {
  id: string;
  tradeUuid?: string;
  symbol: string;
  buyPrice: number;
  currentLTP: number;
  markPrice?: number;
  quantity: number;
  lots?: number;
  lot_size?: number;
  profitLoss: number;
  netPl: number;
  charges: number;
  status: "in_trade" | "closed";
  entryDate: string;
  sellPrice: number | null;
  target: number;
  stopploss: number;
  highest_ltp?: number;
  strategy_name: string;
  instrument_type?: string;
  exit_reason?: string | null;
  trade_time: string;
  legCount?: number;
  eodDecision?: string | null;
  live?: boolean;
  updatedAt?: string;
}

interface PositionState {
  positions: Position[];
  strategyFilter: StrategyFilterValue;
  includeClosed: boolean;
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
  lastSocketAt: string | null;
}

const initialState: PositionState = {
  positions: [],
  strategyFilter: "NIFTY_OPTIONS_SCALP",
  includeClosed: false,
  loading: false,
  error: null,
  socketConnected: false,
  lastSocketAt: null,
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

const matchesFilter = (
  strategyName: string | undefined,
  filter: StrategyFilterValue,
) => filter === "all" || strategyName === filter;

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
    setPositionsSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    updatePositionFromSocket: (state, action) => {
      const updates = action.payload?.data;
      if (!Array.isArray(updates)) return;

      state.lastSocketAt = new Date().toISOString();
      const byId = new Map(state.positions.map((p) => [String(p.id), p]));

      for (const raw of updates) {
        if (!raw?.id) continue;
        const updated = raw as Partial<Position> & { id: string };
        const id = String(updated.id);

        if (!matchesFilter(updated.strategy_name, state.strategyFilter)) {
          continue;
        }
        if (!state.includeClosed && updated.status === "closed") {
          // Drop closed from list when toggle is off
          if (byId.has(id)) {
            state.positions = state.positions.filter((p) => String(p.id) !== id);
            byId.delete(id);
          }
          continue;
        }

        const existing = byId.get(id);
        if (existing) {
          // Merge live fields; keep legCount from REST if socket omits it
          Object.assign(existing, {
            ...updated,
            buyPrice: Number(updated.buyPrice ?? existing.buyPrice),
            currentLTP: Number(updated.currentLTP ?? existing.currentLTP),
            markPrice: Number(
              updated.markPrice ?? updated.currentLTP ?? existing.markPrice,
            ),
            sellPrice:
              updated.sellPrice === undefined
                ? existing.sellPrice
                : updated.sellPrice,
            profitLoss: Number(updated.profitLoss ?? existing.profitLoss),
            netPl: Number(updated.netPl ?? existing.netPl),
            charges: Number(updated.charges ?? existing.charges),
            quantity: Number(updated.quantity ?? existing.quantity),
            target: Number(updated.target ?? existing.target),
            stopploss: Number(updated.stopploss ?? existing.stopploss),
            highest_ltp: Number(
              updated.highest_ltp ?? existing.highest_ltp ?? 0,
            ),
            legCount: updated.legCount ?? existing.legCount,
            live: updated.live ?? true,
            updatedAt: updated.updatedAt || new Date().toISOString(),
          });
        } else if (
          state.includeClosed ||
          updated.status === "in_trade" ||
          !updated.status
        ) {
          const next = {
            ...updated,
            buyPrice: Number(updated.buyPrice || 0),
            currentLTP: Number(updated.currentLTP || 0),
            profitLoss: Number(updated.profitLoss || 0),
            netPl: Number(updated.netPl || 0),
            charges: Number(updated.charges || 0),
            quantity: Number(updated.quantity || 0),
            sellPrice:
              updated.sellPrice === undefined ? null : updated.sellPrice,
            live: true,
          } as Position;
          state.positions.unshift(next);
          byId.set(id, next);
        }
      }
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
  setPositionsSocketConnected,
} = positionSlice.actions;
export default positionSlice.reducer;
