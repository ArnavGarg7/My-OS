import type { Supplement } from "./types";

/**
 * Supplement tracking (Sprint 4.2). Pure read helpers over the supplement stack.
 */
export function activeSupplements(supplements: Supplement[]): Supplement[] {
  return supplements.filter((s) => s.active);
}

export function dailySupplements(supplements: Supplement[]): Supplement[] {
  return activeSupplements(supplements).filter(
    (s) =>
      s.frequency === "once_daily" ||
      s.frequency === "twice_daily" ||
      s.frequency === "thrice_daily",
  );
}
