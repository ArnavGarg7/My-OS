/**
 * Client-safe structured error reporter (Phase 4.5, Observability). React error boundaries run
 * in the browser, where the server logger's `process.stderr` is unavailable — so boundaries call
 * this instead. It emits the SAME structured shape (a single JSON object) to `console.error`, so
 * client and server error lines stay comparable. No PII: only the error name/message and the
 * boundary that caught it. This is the one place a client error line is produced.
 */
export function reportClientError(input: {
  boundary: string;
  error: { name?: string | undefined; message?: string | undefined; digest?: string | undefined };
}): void {
  const line = {
    ts: new Date().toISOString(),
    level: "error" as const,
    message: `client-boundary ${input.boundary}`,
    module: "client",
    operation: input.boundary,
    status: "error" as const,
    error: {
      name: input.error.name ?? "Error",
      message: input.error.message ?? "Unknown client error",
      ...(input.error.digest ? { digest: input.error.digest } : {}),
    },
  };
  console.error(JSON.stringify(line));
}
