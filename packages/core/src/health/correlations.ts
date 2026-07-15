import type { Correlation } from "./types";

/**
 * Correlation engine (Sprint 2.9). Pure descriptive statistics — Pearson
 * correlation between two aligned numeric series. Only statistics, no AI
 * inference; predictive insight is reserved for the AI Platform.
 */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const mx = mean(x);
  const my = mean(y);
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
  if (denom === 0) return 0;
  return Math.max(-1, Math.min(1, num / denom));
}

export function strengthOf(coefficient: number): Correlation["strength"] {
  const abs = Math.abs(coefficient);
  if (abs < 0.2) return "none";
  if (abs < 0.4) return "weak";
  if (abs < 0.7) return "moderate";
  return "strong";
}

/** Correlate two named, aligned series into a `Correlation`. */
export function correlate(a: string, xs: number[], b: string, ys: number[]): Correlation {
  const n = Math.min(xs.length, ys.length);
  const coefficient = Math.round(pearson(xs, ys) * 100) / 100;
  return { a, b, coefficient, strength: strengthOf(coefficient), samples: n };
}

function mean(v: number[]): number {
  return v.reduce((s, x) => s + x, 0) / v.length;
}
