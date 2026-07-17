"use client";

/**
 * Root global error boundary (Phase 4.5, Observability). Next.js renders this only when the root
 * layout itself throws — so it must supply its own <html>/<body>. It reports through the client
 * structured reporter and offers a deterministic reset. Intentionally dependency-light (no shell
 * chrome, inline styles) because the design system may be part of what failed to render.
 */
import { useEffect } from "react";
import { reportClientError } from "@/lib/observability/report-client-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      boundary: "global",
      error: { name: error.name, message: error.message, digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0b0b0c",
          color: "#e7e7e9",
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>The app hit a problem</h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
            An unexpected error stopped the page from loading. Your data is safe. Reload to try
            again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #2a2a2e",
              background: "#1a1a1d",
              color: "#e7e7e9",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
