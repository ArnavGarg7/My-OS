import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "../constants";

export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: "standard" | "compact";
}

/** Format a number, e.g. "1,234" or "1.2K" (compact). */
export function formatNumber(value: number, options: NumberFormatOptions = {}): string {
  const { locale = DEFAULT_LOCALE, minimumFractionDigits, maximumFractionDigits, notation } =
    options;
  return new Intl.NumberFormat(locale, {
    ...(minimumFractionDigits === undefined ? {} : { minimumFractionDigits }),
    ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }),
    ...(notation ? { notation } : {}),
  }).format(value);
}

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  /** Interpret the value as minor units (paise/cents) and divide by 100. */
  fromMinor?: boolean;
  maximumFractionDigits?: number;
}

/** Format money, e.g. "₹1,250.00". Pass `fromMinor` for paise/cents amounts. */
export function formatCurrency(value: number, options: CurrencyFormatOptions = {}): string {
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    fromMinor = false,
    maximumFractionDigits,
  } = options;
  const amount = fromMinor ? value / 100 : value;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }),
  }).format(amount);
}

export interface PercentageFormatOptions {
  locale?: string;
  /** Treat the value as a 0–1 ratio (e.g. 0.72 → "72%"). Default true. */
  isRatio?: boolean;
  fractionDigits?: number;
}

/** Format a percentage, e.g. "72%". */
export function formatPercentage(value: number, options: PercentageFormatOptions = {}): string {
  const { locale = DEFAULT_LOCALE, isRatio = true, fractionDigits = 0 } = options;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(isRatio ? value : value / 100);
}
