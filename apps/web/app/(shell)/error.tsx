"use client";

/**
 * Shell segment error boundary (Phase 4.5, Observability). Next.js renders this when any route
 * under (shell) throws during render. It reports the error through the client structured reporter
 * (same shape as server logs) and offers a deterministic recovery — `reset()` re-renders the
 * segment. Kept minimal and design-system native so a failing module degrades to a calm surface
 * rather than a blank screen.
 */
import { useEffect } from "react";
import { Button, Card, Text } from "@myos/ui";
import { AlertTriangle } from "lucide-react";
import { reportClientError } from "@/lib/observability/report-client-error";

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      boundary: "shell",
      error: { name: error.name, message: error.message, digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <AlertTriangle className="text-warning h-8 w-8" aria-hidden />
        <Text variant="display-m">Something went wrong</Text>
        <Text variant="body-m" className="text-fg-muted">
          This module hit an unexpected error. Your data is safe — try again, and if it keeps
          happening the request id in the logs will point to the cause.
        </Text>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
