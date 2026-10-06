import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { scalpingAPI } from "@/lib/api";
import { NIFTY_STRATEGY } from "@/lib/constants";

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
  /** null from API means Infinity (JSON-safe) */
  profitFactor: number | null;
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

export interface NiftyTradeSnapshot {
  id?: string;
  trade_id?: string;
  trading_symbol?: string;
  instrument_type?: string;
  buy_price?: number;
  ltp?: number;
  target_price?: number;
  stop_loss?: number;
  qty?: number;
  lot_size?: number;
  pl?: number;
  net_pl?: number;
  charges?: number;
  is_active?: boolean;
  exit_reason?: string | null;
}

export interface NiftyScalpConfigSnapshot {
  mode: string;
  is_active: boolean;
  target_profit_rs: number;
  add_lot_points: number;
  enable_plan_b: boolean;
  enable_overnight_carry: boolean;
  paper_balance: number;
}

/** Normalized status used by UI (mapped from /nifty-scalp/status) */
export interface ScalpingSystemStatus {
  strategy: string;
  mode: string;
  isActive: boolean;
  isLive: boolean;
  liveTradingEnabled: boolean;
  production: boolean;
  balance: number;
  expiry: string | null;
  hedgingCount: number;
  openPosition: boolean;
  engineState: string;
  config: NiftyScalpConfigSnapshot;
  trade: NiftyTradeSnapshot | null;
  position: Record<string, unknown> | null;
  now: string;
  // legacy-compatible optional fields
  marketOpen?: boolean;
  underlyingLtp?: number;
  readyForTrading?: boolean;
  activeStrikes?: { CE?: unknown; PE?: unknown };
  strikeResolution?: { CE?: { ok: boolean; reason?: string }; PE?: { ok: boolean; reason?: string } };
  candleCounts?: { CE?: number; PE?: number };
  todayStats?: {
    tradesCount: number;
    dailyPl: number;
    isHalted: boolean;
  } | null;
  issues?: string[];
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
  profitFactor: number | null;
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
  | "RECONCILE"
  | "SIGNAL_EVAL"
  | "ADD_LOT"
  | "PLAN_B_SCALP"
  | "TARGET_HIT"
  | "CARRY_FORWARD"
  | "ENTRY_FILLED"
  | "CHAIN_SYNC"
  | "HEDGING_SYNC"
  | "LIVE_ORDER_FAIL"
  | "CANNOT_ADD_LOT";

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
  production: boolean;
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
  lastNotify: { event: string; message: string; at: string } | null;
}

const initialState: ScalpingState = {
  performance: null,
  status: null,
  auditLogs: [],
  auditSkipBreakdown: [],
  auditFilters: { days: 7, action: "", limit: 100 },
  mode: "paper",
  isLive: false,
  production: false,
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
  lastNotify: null,
};

type RawNiftyStatus = {
  strategy?: string;
  config?: Partial<NiftyScalpConfigSnapshot> & { mode?: string; is_active?: boolean };
  balance?: number;
  expiry?: string | null;
  hedgingCount?: number;
  position?: Record<string, unknown> | null;
  trade?: NiftyTradeSnapshot | null;
  now?: string;
  isLive?: boolean;
  mode?: string;
  isActive?: boolean;
  liveTradingEnabled?: boolean;
  engineState?: string;
  marketOpen?: boolean;
  underlyingLtp?: number;
  openPosition?: boolean;
  readyForTrading?: boolean;
  issues?: string[];
  todayStats?: ScalpingSystemStatus["todayStats"];
  activeStrikes?: ScalpingSystemStatus["activeStrikes"];
  strikeResolution?: ScalpingSystemStatus["strikeResolution"];
  candleCounts?: ScalpingSystemStatus["candleCounts"];
};

const mapNiftyStatus = (raw: RawNiftyStatus): ScalpingSystemStatus => {
  const mode = (raw.config?.mode || raw.mode || "paper") as string;
  const isLive = Boolean(raw.isLive);
  const isActive = Boolean(raw.config?.is_active ?? raw.isActive ?? true);
  const openPosition = Boolean(raw.position || raw.openPosition);
  const production = isLive && mode === "live";

  let engineState = raw.engineState || "SCANNING";
  if (openPosition) engineState = "IN_TRADE";
  if (!isActive) engineState = "INACTIVE";

  const issues: string[] = [...(raw.issues || [])];
  if ((raw.hedgingCount ?? 0) === 0) {
    issues.push("No Nifty hedging options synced — run chain sync");
  }
  if (!raw.expiry) {
    issues.push("No upcoming Nifty expiry found");
  }

  return {
    strategy: raw.strategy || NIFTY_STRATEGY,
    mode,
    isActive,
    isLive,
    liveTradingEnabled: production,
    production,
    balance: Number(raw.balance ?? raw.config?.paper_balance ?? 0),
    expiry: raw.expiry ?? null,
    hedgingCount: Number(raw.hedgingCount ?? 0),
    openPosition,
    engineState,
    config: {
      mode,
      is_active: isActive,
      target_profit_rs: Number(raw.config?.target_profit_rs ?? 200),
      add_lot_points: Number(raw.config?.add_lot_points ?? 10),
      enable_plan_b: raw.config?.enable_plan_b !== false,
      enable_overnight_carry: raw.config?.enable_overnight_carry !== false,
      paper_balance: Number(raw.config?.paper_balance ?? 0),
    },
    trade: raw.trade ?? null,
    position: raw.position ?? null,
    now: raw.now || new Date().toISOString(),
    marketOpen: raw.marketOpen,
    underlyingLtp: raw.underlyingLtp,
    readyForTrading: issues.length === 0 && isActive,
    activeStrikes: raw.activeStrikes,
    strikeResolution: raw.strikeResolution,
    candleCounts: raw.candleCounts,
    todayStats: raw.todayStats ?? null,
    issues,
  };
};

const buildSkipBreakdown = (logs: AuditLogEntry[]): AuditSkipBreakdownRow[] => {
  const map = new Map<string, number>();
  for (const log of logs) {
    if (log.action !== "SKIP") continue;
    const reason = log.reason || "UNKNOWN";
    map.set(reason, (map.get(reason) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
};

export const fetchScalpingPerformance = createAsyncThunk(
  "scalping/fetchPerformance",
  async (days: number) => {
    const response = await scalpingAPI.getPerformance(days, NIFTY_STRATEGY);
    const raw = (response.data.data ?? {}) as Partial<ScalpingPerformance>;
    // JSON turns Infinity → null; normalize so KPI cards never crash
    const data: ScalpingPerformance = {
      periodDays: Number(raw.periodDays ?? days) || days,
      strategyName: raw.strategyName ?? NIFTY_STRATEGY,
      startDate: raw.startDate ?? "",
      endDate: raw.endDate ?? "",
      totalTrades: Number(raw.totalTrades ?? 0) || 0,
      wins: Number(raw.wins ?? 0) || 0,
      losses: Number(raw.losses ?? 0) || 0,
      winRate: Number(raw.winRate ?? 0) || 0,
      profitFactor:
        raw.profitFactor == null
          ? Number.POSITIVE_INFINITY
          : Number(raw.profitFactor),
      avgWin: Number(raw.avgWin ?? 0) || 0,
      avgLoss: Number(raw.avgLoss ?? 0) || 0,
      expectancy: Number(raw.expectancy ?? 0) || 0,
      totalGrossPl: Number(raw.totalGrossPl ?? 0) || 0,
      totalNetPl: Number(raw.totalNetPl ?? 0) || 0,
      maxDrawdown: Number(raw.maxDrawdown ?? 0) || 0,
      bestDay: raw.bestDay ?? null,
      worstDay: raw.worstDay ?? null,
      exitReasonBreakdown: raw.exitReasonBreakdown ?? {},
      skipReasonBreakdown: Array.isArray(raw.skipReasonBreakdown)
        ? raw.skipReasonBreakdown
        : [],
      dailyStats: Array.isArray(raw.dailyStats) ? raw.dailyStats : [],
    };
    return { data, days };
  },
);

export const fetchScalpingStatus = createAsyncThunk(
  "scalping/fetchStatus",
  async () => {
    const response = await scalpingAPI.getStatus();
    return mapNiftyStatus(response.data.data as RawNiftyStatus);
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
  async (production: boolean, { rejectWithValue }) => {
    try {
      const response = await scalpingAPI.toggleProduction(production);
      return response.data.data as {
        production: boolean;
        isLive: boolean;
        mode: TradingMode;
      };
    } catch (error) {
      return rejectWithValue(getThunkError(error, "Failed to toggle production"));
    }
  },
);

export const updateTradingMode = createAsyncThunk(
  "scalping/updateMode",
  async (mode: TradingMode, { rejectWithValue }) => {
    try {
      const response = await scalpingAPI.updateStrategyConfig({ mode });
      const data = response.data.data as {
        config: { mode: TradingMode };
        isLive: boolean;
      };
      return data;
    } catch (error) {
      return rejectWithValue(getThunkError(error, "Failed to update mode"));
    }
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
      logs?: AuditLogEntry[];
      skipBreakdown?: Array<{ reason?: string; count?: number | string }>;
    };
    const logs = data.logs ?? [];
    const skipBreakdown =
      data.skipBreakdown?.map((row) => ({
        reason: row.reason ?? "UNKNOWN",
        count: Number(row.count ?? 0),
      })) ?? buildSkipBreakdown(logs);
    return { logs, skipBreakdown, filters };
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
    setNiftyNotify: (
      state,
      action: PayloadAction<{ event: string; message: string }>,
    ) => {
      state.lastNotify = {
        ...action.payload,
        at: new Date().toISOString(),
      };
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
        state.production = action.payload.production;
      })
      .addCase(fetchScalpingStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError =
          action.error.message || "Failed to fetch Nifty scalp status";
      })
      .addCase(fetchScalpingConfig.fulfilled, (state, action) => {
        state.mode = action.payload.config.mode;
        state.isLive = action.payload.isLive;
        state.production =
          action.payload.isLive && action.payload.config.mode === "live";
      })
      .addCase(toggleLiveTrading.pending, (state) => {
        state.togglingLive = true;
      })
      .addCase(toggleLiveTrading.fulfilled, (state, action) => {
        state.togglingLive = false;
        state.isLive = action.payload.isLive;
        state.mode = action.payload.mode;
        state.production = action.payload.production;
        if (state.status) {
          state.status.isLive = action.payload.isLive;
          state.status.mode = action.payload.mode;
          state.status.production = action.payload.production;
          state.status.liveTradingEnabled = action.payload.production;
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
        state.production =
          action.payload.isLive && action.payload.config.mode === "live";
        if (state.status) {
          state.status.mode = action.payload.config.mode;
          state.status.production = state.production;
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

export const { setScalpingDays, setAuditFilters, setNiftyNotify } =
  scalpingSlice.actions;
export default scalpingSlice.reducer;
