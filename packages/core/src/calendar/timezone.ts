/**
 * Timezone helpers (Sprint 2.7). The engine stores absolute instants; these
 * helpers format/derive local wall-clock parts for a given IANA timezone using
 * the platform Intl API — deterministic given the same inputs.
 */
export function ms(iso: string): number {
  return new Date(iso).getTime();
}

/** Minutes between two ISO instants. */
export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((ms(endIso) - ms(startIso)) / 60_000);
}

/** The offset (minutes) of a timezone at a given instant. */
export function offsetMinutes(iso: string, timeZone: string): number {
  try {
    const date = new Date(iso);
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour === "24" ? "0" : parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round((asUTC - date.getTime()) / 60_000);
  } catch {
    return 0;
  }
}

/** The local date key (YYYY-MM-DD) of an instant in a timezone. */
export function dateKeyInZone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

/** Format an instant as HH:MM in a timezone. */
export function timeInZone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 16);
  }
}

/** Whether two events' timezones differ (used for timezone-mismatch conflicts). */
export function timezonesDiffer(a: string, b: string): boolean {
  return a !== b;
}
