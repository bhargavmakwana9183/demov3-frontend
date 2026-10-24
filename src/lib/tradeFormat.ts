export const formatExitReason = (reason?: string | null) =>
  reason ? reason.replace(/_/g, " ") : "—";

export const exitReasonVariant = (
  reason?: string | null,
): "default" | "secondary" | "destructive" | "outline" => {
  if (!reason) return "outline";
  if (reason.includes("TARGET") || reason.includes("TRAIL_PROFIT")) return "default";
  if (
    reason.includes("STOP") ||
    reason.includes("MAX_LOSS") ||
    reason.includes("SOFT_NET_LOSS")
  ) {
    return "destructive";
  }
  if (
    reason.includes("EOD") ||
    reason.includes("TIME") ||
    reason.includes("FLIP") ||
    reason.includes("NO_FOLLOW")
  ) {
    return "secondary";
  }
  return "outline";
};

export const STRATEGY_FILTER_OPTIONS = [
  { value: "NIFTY_OPTIONS_SCALP", label: "Nifty 50 Scalper" },
  { value: "all", label: "All strategies" },
  { value: "SCALLPING", label: "SBIN Scalping (legacy)" },
  { value: "SCALLPING_TRAILLING", label: "SBIN Trailing (legacy)" },
] as const;

export type StrategyFilterValue =
  (typeof STRATEGY_FILTER_OPTIONS)[number]["value"];

export const strategyQueryParam = (filter: StrategyFilterValue) =>
  filter === "all" ? undefined : filter;
