/**
 * Typed application errors. Domain code throws `AppError`; the tRPC layer maps
 * `code` to a user-facing message (04_System_Architecture.md §5, 08 §3).
 */
export const APP_ERROR_CODES = [
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION",
  "UNAUTHORIZED",
  "RATE_LIMITED",
  "AI_UNAVAILABLE",
  "AI_BUDGET_EXCEEDED",
  "INTERNAL",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly meta: Record<string, unknown> | undefined;

  constructor(code: AppErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.meta = meta;
  }
}
