import { CORRELATION_MIN_SAMPLES } from "./constants";
import type { Correlation } from "./types";

/**
 * Correlation engine (Sprint 4.2). PURE statistical Pearson correlation between paired
 * series — habit↔readiness, sleep↔focus, workout↔energy, mood↔habits, etc. No modelling,
 * no inference; just the deterministic coefficient + a strength band.
 */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i]! - mx;
    const b = y[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Number((num / denom).toFixed(3));
}

export function strength(coefficient: number): Correlation["strength"] {
  const a = Math.abs(coefficient);
  if (a < 0.2) return "none";
  if (a < 0.4) return "weak";
  if (a < 0.7) return "moderate";
  return "strong";
}

export function correlate(pair: string, xs: number[], ys: number[]): Correlation {
  const samples = Math.min(xs.length, ys.length);
  if (samples < CORRELATION_MIN_SAMPLES) {
    return { pair, coefficient: 0, samples, strength: "none" };
  }
  const coefficient = pearson(xs, ys);
  return { pair, coefficient, samples, strength: strength(coefficient) };
}
