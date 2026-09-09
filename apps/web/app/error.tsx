"use client";

/**
 * Root segment error boundary (Stage A / WS5, reliability). Catches errors that
 * escape the (shell) segment — most importantly a throw in `(shell)/layout.tsx`
 * itself (e.g. `requireUser()` when the database/app server is unreachable), which
 * `(shell)/error.tsx` cannot catch because a boundary never catches its own layout.
 *
 * Without this, such failures fell through to the dependency-light `global-error`.
 * For a self-hosted single-user OS the backend being unreachable is the common case,
 * so this renders a calm, on-brand screen (inside the themed root layout) that names
 * the likely cause and offers a retry — instead of a generic "something went wrong".
 * Server error messages are redacted in production (only a digest survives), so the
 * copy guides without falsely claiming to know the exact fault.
 */
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card, Text } from "@myos/ui";
import { reportClientError } from "@/lib/observability/report-client-error";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      boundary: "root",
      error: { name: error.name, message: error.message, digest: error.digest },
    });
  }, [error]);

  return (
    <div className="bg-base flex min-h-dvh items-center justify-center p-6">
      <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <AlertTriangle className="text-warning h-8 w-8" aria-hidden />
        <Text variant="display-m">The workspace couldn&rsquo;t load</Text>
        <Text variant="body-m" className="text-fg-muted">
          My OS couldn&rsquo;t start up. This usually means a background service — the database or
          the app server — isn&rsquo;t reachable yet. Your data is safe. Try again in a moment, and
          if it keeps happening, check that those services are running.
        </Text>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        {error.digest ? (
          <Text variant="caption" className="text-fg-subtle">
            Reference: {error.digest}
          </Text>
        ) : null}
      </Card>
    </div>
  );
}
