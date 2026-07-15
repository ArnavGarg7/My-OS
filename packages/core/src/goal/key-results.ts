import type { KeyResult, KeyResultProgress } from "./types";

/**
 * Key result engine (Sprint 2.12). Deterministic progress per metric type —
 * numeric/percentage scale to target, boolean is 0/100, milestone is done/not.
 * No free-form formulas.
 */
export function keyResultProgress(kr: KeyResult): number {
  if (kr.status === "completed") return 100;
  switch (kr.metricType) {
    case "boolean":
    case "milestone":
      return kr.currentValue >= 1 ? 100 : 0;
    case "percentage":
      return clamp(Math.round(kr.currentValue));
    case "numeric":
    default:
      if (kr.targetValue <= 0) return kr.currentValue > 0 ? 100 : 0;
      return clamp(Math.round((kr.currentValue / kr.targetValue) * 100));
  }
}

export function isKeyResultComplete(kr: KeyResult): boolean {
  return kr.status === "completed" || keyResultProgress(kr) >= 100;
}

export function analyzeKeyResult(kr: KeyResult): KeyResultProgress {
  const progressPercent = keyResultProgress(kr);
  return { keyResult: kr, progressPercent, complete: progressPercent >= 100 };
}

/** Update a key result's current value; auto-completes on reaching the target. */
export function updateKeyResult(kr: KeyResult, currentValue: number): KeyResult {
  const next = Math.max(0, currentValue);
  const complete =
    kr.metricType === "boolean" || kr.metricType === "milestone"
      ? next >= 1
      : kr.metricType === "percentage"
        ? next >= 100
        : kr.targetValue > 0 && next >= kr.targetValue;
  return { ...kr, currentValue: next, status: complete ? "completed" : "active" };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
