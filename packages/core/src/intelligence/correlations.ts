import { round1 } from "./bands";
import type { AreaCorrelation, LifeAreaView } from "./types";

/**
 * Life-area correlations (Sprint 4.4). Plain Pearson over paired historical area-score
 * series the server supplies — no inference, no significance testing, no causal claim. Two
 * series shorter than the minimum are not reported at all, rather than reported as a number
 * that looks meaningful and isn't.
 */

export const CORRELATION_MIN_SAMPLES = 4;

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = (xs[i] as number) - mx;
    const b = (ys[i] as number) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : round1(num / den);
}

/** Correlate two named area-score series. Returns null below the sample floor. */
export function correlateSeries(
  labelA: string,
  seriesA: number[],
  labelB: string,
  seriesB: number[],
): AreaCorrelation | null {
  const samples = Math.min(seriesA.length, seriesB.length);
  if (samples < CORRELATION_MIN_SAMPLES) return null;
  return {
    label: `${labelA} vs ${labelB}`,
    coefficient: pearson(seriesA, seriesB),
    samples,
  };
}

/**
 * Correlate every pair of area series against each other. `series` maps a label to its
 * historical score list; the strongest |coefficient| pairs come first.
 */
export function areaCorrelations(series: Record<string, number[]>): AreaCorrelation[] {
  const labels = Object.keys(series);
  const out: AreaCorrelation[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      const a = labels[i]!;
      const b = labels[j]!;
      const c = correlateSeries(a, series[a]!, b, series[b]!);
      if (c) out.push(c);
    }
  }
  return out.sort((x, y) => Math.abs(y.coefficient) - Math.abs(x.coefficient));
}

/** Convenience: a fixed label used by the dashboard's "how full" trend line. */
export function averageAreaScore(areas: LifeAreaView[]): number {
  if (areas.length === 0) return 0;
  return Math.round(areas.reduce((sum, a) => sum + a.score, 0) / areas.length);
}
