import type { LifeAreaView, WheelSlice } from "./types";

/**
 * Wheel of Life (Sprint 4.4). Pure re-projection of the life areas into radar-chart values.
 * There is no calculation here at all — it lifts the already-derived area scores into the
 * shape a radar chart wants. Kept separate so the visualization can lazy-load without
 * pulling the rest of the intelligence core with it.
 */

export function wheelOfLife(areas: LifeAreaView[]): WheelSlice[] {
  return areas.map((a) => ({ area: a.area, label: a.label, value: a.score }));
}

/** The average spoke length — a single "how full is the wheel" number for the centre. */
export function wheelFullness(slices: WheelSlice[]): number {
  if (slices.length === 0) return 0;
  return Math.round(slices.reduce((sum, s) => sum + s.value, 0) / slices.length);
}
