import { DEFAULT_LOCALE } from "../constants";

export type DateInput = Date | number | string;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
}

/** Format a calendar date, e.g. "6 Jul 2026". */
export function formatDate(input: DateInput, options: DateFormatOptions = {}): string {
  const { locale = DEFAULT_LOCALE, dateStyle = "medium", timeZone } = options;
  return new Intl.DateTimeFormat(locale, { dateStyle, ...(timeZone ? { timeZone } : {}) }).format(
    toDate(input),
  );
}

export interface TimeFormatOptions {
  locale?: string;
  timeZone?: string;
  timeStyle?: "full" | "long" | "medium" | "short";
  hour12?: boolean;
}

/** Format a wall-clock time, e.g. "2:30 PM". */
export function formatTime(input: DateInput, options: TimeFormatOptions = {}): string {
  const { locale = DEFAULT_LOCALE, timeStyle = "short", timeZone, hour12 } = options;
  return new Intl.DateTimeFormat(locale, {
    timeStyle,
    ...(timeZone ? { timeZone } : {}),
    ...(hour12 === undefined ? {} : { hour12 }),
  }).format(toDate(input));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

export interface RelativeTimeOptions {
  locale?: string;
  /** Reference "now". Defaults to the current time. */
  base?: DateInput;
  numeric?: "always" | "auto";
}

/** Human relative time, e.g. "2 hours ago", "in 3 days". */
export function formatRelativeTime(input: DateInput, options: RelativeTimeOptions = {}): string {
  const { locale = DEFAULT_LOCALE, base = Date.now(), numeric = "auto" } = options;
  const diffSeconds = (toDate(input).getTime() - toDate(base).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds || unit === "second") {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return rtf.format(0, "second");
}

export interface DurationOptions {
  /** Unit of the input value. Default "minutes". */
  unit?: "seconds" | "minutes";
  /** "short" → "2h 10m"; "clock" → "02:10:00"; "long" → "2 hours 10 minutes". */
  style?: "short" | "clock" | "long";
}

/** Format an elapsed/estimated duration. */
export function formatDuration(value: number, options: DurationOptions = {}): string {
  const { unit = "minutes", style = "short" } = options;
  let totalSeconds = Math.max(0, Math.round(unit === "minutes" ? value * 60 : value));

  const days = Math.floor(totalSeconds / 86400);
  totalSeconds -= days * 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  if (style === "clock") {
    const pad = (n: number) => String(n).padStart(2, "0");
    const base = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return days > 0 ? `${days}d ${base}` : base;
  }

  const parts: string[] = [];
  if (style === "long") {
    const push = (n: number, label: string) => {
      if (n > 0) parts.push(`${n} ${label}${n === 1 ? "" : "s"}`);
    };
    push(days, "day");
    push(hours, "hour");
    push(minutes, "minute");
    if (parts.length === 0) push(seconds, "second");
    return parts.join(" ");
  }

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

export interface CountdownOptions {
  /** Reference "now". Defaults to the current time. */
  base?: DateInput;
}

/** Countdown to a target time, e.g. "02:14:33" or "3d 04:12:00". Clamps at 0. */
export function formatCountdown(target: DateInput, options: CountdownOptions = {}): string {
  const { base = Date.now() } = options;
  const remainingSeconds = Math.max(
    0,
    Math.floor((toDate(target).getTime() - toDate(base).getTime()) / 1000),
  );
  return formatDuration(remainingSeconds, { unit: "seconds", style: "clock" });
}
