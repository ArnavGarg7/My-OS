/**
 * Resource date helpers (Sprint 4.3). Every countdown in this platform — renewals,
 * expiries, birthdays, maintenance — is calendar maths against a passed `now`. Pure and
 * UTC-based so results are identical in tests and in production.
 */

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDate(date: string): Date {
  return new Date(`${date.slice(0, 10)}T00:00:00.000Z`);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}

/** Whole days from `from` to `to`; negative when `to` is in the past. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

/** Fractional years between two instants — the CAGR/depreciation time base. */
export function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (365.25 * 86_400_000);
}

/** Round to 2dp without float drift creeping into money values. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Resolve a year-agnostic MM-DD against `now` into the next concrete occurrence. Feb 29 in
 * a non-leap year lands on Mar 1, matching how calendars actually behave.
 */
export function nextOccurrence(monthDay: string, now: Date): Date {
  const [mm, dd] = monthDay.split("-").map((s) => Number(s));
  if (!mm || !dd) return now;
  const year = now.getUTCFullYear();
  const make = (y: number) => new Date(Date.UTC(y, mm - 1, dd));
  let candidate = make(year);
  // JS rolls invalid dates forward (Feb 29 → Mar 1), which is the behaviour we want.
  if (daysBetween(now, candidate) < 0) candidate = make(year + 1);
  return candidate;
}
