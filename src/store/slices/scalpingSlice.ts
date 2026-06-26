import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { scalpingAPI } from "@/lib/api";

export interface ScalpingDailyStat {
  tradeDate: string;
  tradesCount: number;
  winsCount: number;
  lossesCount: number;
  dailyPl: number;
  dailyPlAfterCharges: number;
}

export interface ScalpingSkipReason {
  reason: string;
  count: number;
}

export interface ScalpingPerformance {
  periodDays: number;
  strategyName: string;
  startDate: string;
  endDate: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  totalGrossPl: number;
  totalNetPl: number;
  maxDrawdown: number;
  bestDay: { date: string; pl: number } | null;
  worstDay: { date: string; pl: number } | null;
  exitReasonBreakdown: Record<string, number>;
  skipReasonBreakdown: ScalpingSkipReason[];
  dailyStats: ScalpingDailyStat[];
}

export interface ResolvedStrike {
  instrument_key: string;
  instrument_type: string;
  trading_symbol: string;
  strike_price: number;
  ltp: number;
  lot_size: number;
  expiry: string;
  bid_price?: number;
  ask_price?: number;
  open_interest?: number;
  spread_pct?: number;
}

export interface ScalpingSystemStatus {
  mode: string;
  isActive: boolean;
  isLive: boolean;
  liveTradingEnabled: boolean;
  marketOpen: boolean;
  engineState: string;
  underlyingLtp: number;
  openPosition: boolean;
  readyForTrading: boolean;
  activeStrikes: {
    CE?: ResolvedStrike | null;
    PE?: ResolvedStrike | null;
  };
  strikeResolution: {
    CE?: { ok: boolean; reason?: string };
    PE?: { ok: boolean; reason?: string };
  };
  candleCounts: {
    CE?: number;
    PE?: number;
  };
  todayStats: {
    tradesCount: number;
    dailyPl: number;
    isHalted: boolean;
  } | null;
  issues: string[];
}

export type TradingMode = "paper" | "live" | "backtest";

export type SignalType = "CE" | "PE";

export interface BacktestTrade {
  id: string;
  signalType: SignalType;
  instrumentKey: string;
  entryTime: string;
  exitTime: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  lotSize: number;
  grossPl: number;
  netPl: number;
  exitReason: string;
}

export interface BacktestResult {
  runId: string;
  startDate: string;
  endDate: string;
  instrumentKey: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  totalGrossPl: number;
  totalNetPl: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
}

export interface ParamOptimizationResult {
  param: string;
  currentValue: number;
  bestValue: number;
  baselineProfitFactor: number;
  bestProfitFactor: number;
  baselineWinRate: number;
  bestWinRate: number;
  improved: boolean;
  trials: Array<{
    value: number;
    profitFactor: number;
    winRate: number;
    totalNetPl: number;
    totalTrades: number;
  }>;
}

export interface OptimizationReport {
  startDate: string;
  endDate: string;
  signalType: SignalType;
  instrumentType: SignalType;
  baseline: BacktestResult;
  paramResults: ParamOptimizationResult[];
  suggestedOverrides: Record<string, number>;
  applied: boolean;
}

export const TUNABLE_PARAMS = [
  "min_rr_ratio",
  "atr_stop_multiplier",
  "atr_target_multiplier",
  "rsi_ce_max",
  "rsi_pe_min",
  "trailing_atr_multiplier",
  "max_trades_per_day",
] as const;

export type TunableParam = (typeof TUNABLE_PARAMS)[number];

export type AuditAction =
  | "SKIP"
  | "ENTER"
  | "EXIT"
  | "HOLD"
  | "PARTIAL"
  | "RECONCILE";

export interface AuditLogEntry {
  id: string;
  strategy_name: string;
  timestamp: string;
  instrument_key?: string | null;
  ema9?: number | null;
  ema21?: number | null;
  rsi?: number | null;
  atr?: number | null;
  volume?: number | null;
  avg_volume?: number | null;
  signal?: string | null;
  action: AuditAction | string;
  reason?: string | null;
  engine_state?: string | null;
  mode?: string | null;
  trade_id?: string | null;
  config_snapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditSkipBreakdownRow {
  reason: string;
  count: number;
}

export interface AuditLogFilters {
  days: number;
  action: string;
  limit: number;
}

interface ScalpingState {
  performance: ScalpingPerformance | null;
  status: ScalpingSystemStatus | null;
  auditLogs: AuditLogEntry[];
  auditSkipBreakdown: AuditSkipBreakdownRow[];
  auditFilters: AuditLogFilters;
  mode: TradingMode;
  isLive: boolean;
  days: number;
  loading: boolean;
  statusLoading: boolean;
  auditLoading: boolean;
  togglingLive: boolean;
  updatingMode: boolean;
  error: string | null;
  statusError: string | null;
  auditError: string | null;
  backtestResult: BacktestResult | null;
  backtestLoading: boolean;
  backtestError: string | null;
  optimizationReport: OptimizationReport | null;
  optimizeLoading: boolean;
  optimizeError: string | null;
}

const initialState: ScalpingState = {
  performance: null,
  status: null,
  auditLogs: [],
  auditSkipBreakdown: [],
  auditFilters: { days: 7, action: "", limit: 100 },
  mode: "paper",
  isLive: false,
  days: 30,
  loading: false,
  statusLoading: false,
  auditLoading: false,
  togglingLive: false,
  updatingMode: false,
  error: null,
  statusError: null,
  auditError: null,
  backtestResult: null,
  backtestLoading: false,
  backtestError: null,
  optimizationReport: null,
  optimizeLoading: false,
  optimizeError: null,
};

export const fetchScalpingPerformance = createAsyncThunk(
  "scalping/fetchPerformance",
  async (days: number) => {
    const response = await scalpingAPI.getPerformance(days);
    return { data: response.data.data as ScalpingPerformance, days };
  },
);

export const fetchScalpingStatus = createAsyncThunk(
  "scalping/fetchStatus",
  async () => {
    const response = await scalpingAPI.getStatus();
    return response.data.data as ScalpingSystemStatus;
  },
);

export const fetchScalpingConfig = createAsyncThunk(
  "scalping/fetchConfig",
  async () => {
    const response = await scalpingAPI.getStrategyConfig();
    const data = response.data.data as {
      config: { mode: TradingMode };
      isLive: boolean;
    };
    return data;
  },
);

export const toggleLiveTrading = createAsyncThunk(
  "scalping/toggleLive",
  async () => {
    const response = await scalpingAPI.toggleLiveTrading();
    return response.data.data as {
      isLive: boolean;
      mode: TradingMode;
      liveTradingEnabled: boolean;
    };
  },
);

export const updateTradingMode = createAsyncThunk(
  "scalping/updateMode",
  async (mode: TradingMode) => {
    const response = await scalpingAPI.updateStrategyConfig({ mode });
    const data = response.data.data as {
      config: { mode: TradingMode };
      isLive: boolean;
    };
    return data;
  },
);

export const fetchScalpingAuditLog = createAsyncThunk(
  "scalping/fetchAuditLog",
  async (filters: AuditLogFilters) => {
    const response = await scalpingAPI.getAuditLog({
      days: filters.days,
      action: filters.action || undefined,
      limit: filters.limit,
    });
    const data = response.data.data as {
      logs: AuditLogEntry[];
      skipBreakdown: Array<{ reason?: string; count?: number | string }>;
    };
    const skipBreakdown = (data.skipBreakdown ?? []).map((row) => ({
      reason: row.reason ?? "UNKNOWN",
      count: Number(row.count ?? 0),
    }));
    return { logs: data.logs ?? [], skipBreakdown, filters };
  },
);

const getThunkError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === "string") return msg;
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export const runScalpingBacktest = createAsyncThunk(
  "scalping/runBacktest",
  async (
    payload: {
      startDate: string;
      endDate: string;
      signalType: SignalType;
      instrumentType: SignalType;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await scalpingAPI.runBacktest(payload);
      return response.data.data as BacktestResult;
    } catch (error) {
      return rejectWithValue(getThunkError(error, "Backtest failed"));
    }
  },
);

export const runScalpingOptimize = createAsyncThunk(
  "scalping/runOptimize",
  async (
    payload: {
      days: number;
      signalType: SignalType;
      instrumentType: SignalType;
      applyBest: boolean;
      params?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await scalpingAPI.runOptimize(payload);
      return response.data.data as OptimizationReport;
    } catch (error) {
      return rejectWithValue(getThunkError(error, "Optimization failed"));
    }
  },
);

const scalpingSlice = createSlice({
  name: "scalping",
  initialState,
  reducers: {
    setScalpingDays: (state, action: PayloadAction<number>) => {
      state.days = action.payload;
    },
    setAuditFilters: (state, action: PayloadAction<Partial<AuditLogFilters>>) => {
      state.auditFilters = { ...state.auditFilters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScalpingPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScalpingPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.performance = action.payload.data;
        state.days = action.payload.days;
      })
      .addCase(fetchScalpingPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch scalping performance";
      })
      .addCase(fetchScalpingStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
      })
      .addCase(fetchScalpingStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.status = action.payload;
        state.mode = (action.payload.mode as TradingMode) || "paper";
        state.isLive = action.payload.isLive;
      })
      .addCase(fetchScalpingStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError =
          action.error.message || "Failed to fetch scalping status";
      })
      .addCase(fetchScalpingConfig.fulfilled, (state, action) => {
        state.mode = action.payload.config.mode;
        state.isLive = action.payload.isLive;
      })
      .addCase(toggleLiveTrading.pending, (state) => {
        state.togglingLive = true;
      })
      .addCase(toggleLiveTrading.fulfilled, (state, action) => {
        state.togglingLive = false;
        state.isLive = action.payload.isLive;
        state.mode = action.payload.mode;
        if (state.status) {
          state.status.isLive = action.payload.isLive;
          state.status.liveTradingEnabled = action.payload.liveTradingEnabled;
          state.status.mode = action.payload.mode;
        }
      })
      .addCase(toggleLiveTrading.rejected, (state) => {
        state.togglingLive = false;
      })
      .addCase(updateTradingMode.pending, (state) => {
        state.updatingMode = true;
      })
      .addCase(updateTradingMode.fulfilled, (state, action) => {
        state.updatingMode = false;
        state.mode = action.payload.config.mode;
        state.isLive = action.payload.isLive;
        if (state.status) {
          state.status.mode = action.payload.config.mode;
        }
      })
      .addCase(updateTradingMode.rejected, (state) => {
        state.updatingMode = false;
      })
      .addCase(fetchScalpingAuditLog.pending, (state) => {
        state.auditLoading = true;
        state.auditError = null;
      })
      .addCase(fetchScalpingAuditLog.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.auditLogs = action.payload.logs;
        state.auditSkipBreakdown = action.payload.skipBreakdown;
        state.auditFilters = action.payload.filters;
      })
      .addCase(fetchScalpingAuditLog.rejected, (state, action) => {
        state.auditLoading = false;
        state.auditError =
          action.error.message || "Failed to fetch audit log";
      })
      .addCase(runScalpingBacktest.pending, (state) => {
        state.backtestLoading = true;
        state.backtestError = null;
      })
      .addCase(runScalpingBacktest.fulfilled, (state, action) => {
        state.backtestLoading = false;
        state.backtestResult = action.payload;
      })
      .addCase(runScalpingBacktest.rejected, (state, action) => {
        state.backtestLoading = false;
        state.backtestError =
          (action.payload as string) || "Backtest failed";
      })
      .addCase(runScalpingOptimize.pending, (state) => {
        state.optimizeLoading = true;
        state.optimizeError = null;
      })
      .addCase(runScalpingOptimize.fulfilled, (state, action) => {
        state.optimizeLoading = false;
        state.optimizationReport = action.payload;
      })
      .addCase(runScalpingOptimize.rejected, (state, action) => {
        state.optimizeLoading = false;
        state.optimizeError =
          (action.payload as string) || "Optimization failed";
      });
  },
});

export const { setScalpingDays, setAuditFilters } = scalpingSlice.actions;
export default scalpingSlice.reducer;
