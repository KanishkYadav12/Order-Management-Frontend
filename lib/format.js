/**
 * Formatting helpers.
 *
 * Money is formatted through `Intl` rather than by string-concatenating a
 * symbol, so grouping follows the Indian lakh/crore convention
 * (₹1,20,000, not ₹120,000) — which is what the people using this expect.
 */

const currencyCache = new Map();

const formatter = (currency = "INR", options = {}) => {
  const key = `${currency}:${JSON.stringify(options)}`;
  if (!currencyCache.has(key)) {
    currencyCache.set(
      key,
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
        ...options,
      })
    );
  }
  return currencyCache.get(key);
};

/** ₹1,234.50 */
export const formatMoney = (amount, currency = "INR") =>
  formatter(currency).format(Number(amount) || 0);

/** ₹1,235 — for headline figures where paise are noise. */
export const formatMoneyShort = (amount, currency = "INR") =>
  formatter(currency, { maximumFractionDigits: 0 }).format(Number(amount) || 0);

/** ₹1.2L / ₹3.4Cr — for axis labels and tight stat tiles. */
export const formatCompactMoney = (amount, symbol = "₹") => {
  const value = Number(amount) || 0;
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `${symbol}${(value / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${symbol}${(value / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}K`;
  return `${symbol}${value.toFixed(0)}`;
};

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

export const formatDate = (value, options = {}) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
};

export const formatTime = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatDateTime = (value) =>
  value ? `${formatDate(value)} · ${formatTime(value)}` : "—";

/** "just now" · "12m ago" · "3h ago" — for order age on the kitchen board. */
export const formatRelative = (value) => {
  if (!value) return "—";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
};

/** Whole minutes since a timestamp, for "waiting 14 min" style copy. */
export const minutesSince = (value) =>
  value ? Math.floor((Date.now() - new Date(value).getTime()) / 60_000) : 0;

/** Percentage change between two periods, rounded to a whole number. */
export const percentChange = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
};

export const pluralise = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
