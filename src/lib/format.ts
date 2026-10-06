/** Safe numeric helpers — API may send null when JSON drops Infinity/NaN */

export const toNum = (value: unknown, fallback = 0): number => {
  if (value == null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Profit factor: Infinity serializes as null over JSON */
export const toProfitFactor = (value: unknown): number => {
  if (value == null) return Number.POSITIVE_INFINITY;
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return 0;
  return n;
};

export const formatRatio = (value: unknown): string => {
  const n = toProfitFactor(value);
  if (!Number.isFinite(n)) return '∞';
  return n.toFixed(2);
};

export const formatPct = (value: unknown, digits = 1): string =>
  `${toNum(value).toFixed(digits)}%`;

export const formatMoney = (value: unknown): string => {
  const n = toNum(value);
  return `₹${Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatMoneySigned = (value: unknown): string => {
  const n = toNum(value);
  const abs = formatMoney(n);
  return n >= 0 ? `+${abs}` : `-${abs}`;
};
