/**
 * Observability barrel (Phase 4.5). Structured logging + client error reporting primitives.
 * The tRPC middleware (server/trpc.ts) is the single server instrumentation point; the app
 * error boundaries (app/global-error.tsx, app/(shell)/error.tsx) are the client ones.
 */
export {
  emit,
  logOperation,
  newRequestId,
  toLogError,
  type LogLevel,
  type LogRecord,
} from "./logger";
export { reportClientError } from "./report-client-error";
