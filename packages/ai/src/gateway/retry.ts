/**
 * Retry policy (Sprint 5.1). Pure decision function — given an attempt number and an error, decide
 * whether to retry and how long to wait (exponential backoff). Transport/rate-limit/5xx-style
 * errors are retryable; validation and refusal errors are not. The gateway owns the actual waiting;
 * this module only decides, so it stays deterministic and testable.
 */
import { DEFAULTS } from "../config/defaults";

export type ErrorClass =
  "rate_limit" | "server" | "timeout" | "network" | "refusal" | "invalid" | "unknown";

/** Classify an error into a retry class from its message/name (best-effort, deterministic). */
export function classifyError(err: unknown): ErrorClass {
  const msg = (err instanceof Error ? `${err.name} ${err.message}` : String(err)).toLowerCase();
  if (msg.includes("not configured")) return "invalid";
  if (msg.includes("rate") && msg.includes("limit")) return "rate_limit";
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("network") || msg.includes("econn") || msg.includes("fetch")) return "network";
  if (msg.includes("refus")) return "refusal";
  if (msg.includes("invalid") || msg.includes("validation") || msg.includes("schema"))
    return "invalid";
  if (msg.includes("5") && msg.includes("server")) return "server";
  return "unknown";
}

const RETRYABLE: ReadonlySet<ErrorClass> = new Set(["rate_limit", "server", "timeout", "network"]);

export interface RetryDecision {
  retry: boolean;
  delayMs: number;
  errorClass: ErrorClass;
}

/**
 * Decide whether to retry attempt `attempt` (0-indexed) that failed with `err`.
 * `maxRetries` defaults to the platform default.
 */
export function decideRetry(
  err: unknown,
  attempt: number,
  maxRetries = DEFAULTS.maxRetries,
): RetryDecision {
  const errorClass = classifyError(err);
  const retry = RETRYABLE.has(errorClass) && attempt < maxRetries;
  const delayMs = retry ? DEFAULTS.retryBackoffBaseMs * 2 ** attempt : 0;
  return { retry, delayMs, errorClass };
}
