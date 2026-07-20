/**
 * Structured Output Framework (Sprint 5.1, 06_AI_Architecture §Structured Output). Every AI feature
 * that consumes JSON runs its provider text through here: extract JSON → validate against a zod
 * schema → one repair attempt → fallback. Deterministic and pure. Telemetry counts the repairs.
 */
import type { ZodType } from "zod";
import { DEFAULTS } from "../config/defaults";

export interface StructuredResult<T> {
  ok: boolean;
  parsed: T | null;
  repairCount: number;
  /** Populated when ok=false. */
  error?: string;
}

/**
 * Validate `text` as JSON matching `schema`. Attempts up to `DEFAULTS.maxRepairAttempts` cheap,
 * deterministic repairs (strip code fences, extract the outermost JSON object/array) before failing.
 */
export function validateStructured<T>(text: string, schema: ZodType<T>): StructuredResult<T> {
  let repairCount = 0;
  let candidate = text;
  for (let attempt = 0; attempt <= DEFAULTS.maxRepairAttempts; attempt += 1) {
    const json = tryParseJson(candidate);
    if (json !== undefined) {
      const result = schema.safeParse(json);
      if (result.success) return { ok: true, parsed: result.data, repairCount };
      if (attempt < DEFAULTS.maxRepairAttempts) {
        repairCount += 1;
        candidate = repair(candidate);
        continue;
      }
      return { ok: false, parsed: null, repairCount, error: result.error.message };
    }
    if (attempt < DEFAULTS.maxRepairAttempts) {
      repairCount += 1;
      candidate = repair(candidate);
      continue;
    }
    return { ok: false, parsed: null, repairCount, error: "no JSON found in output" };
  }
  return { ok: false, parsed: null, repairCount, error: "exhausted repair attempts" };
}

function tryParseJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

/** Deterministic repairs: strip ``` fences and extract the outermost {...} or [...]. */
function repair(text: string): string {
  let t = text.replace(/```(?:json)?/gi, "").trim();
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  const start =
    firstArr === -1 ? firstObj : firstObj === -1 ? firstArr : Math.min(firstObj, firstArr);
  if (start >= 0) {
    const open = t[start];
    const close = open === "{" ? "}" : "]";
    const end = t.lastIndexOf(close);
    if (end > start) t = t.slice(start, end + 1);
  }
  return t;
}
