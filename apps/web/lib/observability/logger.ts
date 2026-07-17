/**
 * Structured logging primitive (Phase 4.5, Observability). Every log line is a single JSON
 * object with a stable field set, so a log aggregator (or Phase 5's AI operations layer) can
 * index and query them without parsing free text. There is exactly one emitter — `emit` —
 * and one helper — `logOperation` — that the tRPC middleware calls per request.
 *
 * Deterministic by construction: no timestamps are invented inside pure code paths (the caller
 * supplies duration); the only nondeterminism is `Date.now()` at the boundary, which belongs in
 * a log line. This module has no feature logic — it is pure plumbing.
 */

/** Severity, ordered least→most severe. Mirrors the levels a log aggregator expects. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * The canonical structured-log shape. Every request-scoped line carries these dimensions so
 * they can be filtered/grouped consistently. `requestId` correlates all lines for one request;
 * `userId` is the acting identity (never PII beyond the opaque id); `module`/`operation` locate
 * the code path; `durationMs`/`status` capture the outcome.
 */
export interface LogRecord {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  module?: string;
  operation?: string;
  durationMs?: number;
  status?: "ok" | "error";
  /** Optional structured extras — kept flat and JSON-serialisable. */
  fields?: Record<string, string | number | boolean | null>;
  /** Error class + message only — never a stack with paths, never PII. */
  error?: { name: string; message: string };
}

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Minimum level to emit. Quietens debug/info in production unless explicitly raised. */
function minLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

/**
 * Emit one structured line. Writes a single JSON object to stdout (info/debug/warn) or stderr
 * (error) — one line, machine-parseable. This is the ONLY place a log line is produced.
 */
export function emit(record: LogRecord): void {
  if (LEVEL_RANK[record.level] < LEVEL_RANK[minLevel()]) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record });
  if (record.level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

/** Narrow an unknown thrown value to the log-safe `{ name, message }` shape. */
export function toLogError(err: unknown): { name: string; message: string } {
  if (err instanceof Error) return { name: err.name, message: err.message };
  return { name: "UnknownError", message: String(err) };
}

/**
 * Log a completed operation (used by the tRPC middleware). Chooses level from status: an error
 * status logs at `error`, otherwise `info`. Keeps the field set identical across both so lines
 * are comparable.
 */
export function logOperation(input: {
  requestId: string;
  userId?: string;
  module: string;
  operation: string;
  durationMs: number;
  status: "ok" | "error";
  error?: { name: string; message: string };
}): void {
  emit({
    level: input.status === "error" ? "error" : "info",
    message: `${input.module}.${input.operation} ${input.status}`,
    requestId: input.requestId,
    ...(input.userId !== undefined ? { userId: input.userId } : {}),
    module: input.module,
    operation: input.operation,
    durationMs: input.durationMs,
    status: input.status,
    ...(input.error ? { error: input.error } : {}),
  });
}

/** Generate a short, collision-resistant request id (no external deps). */
export function newRequestId(): string {
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
