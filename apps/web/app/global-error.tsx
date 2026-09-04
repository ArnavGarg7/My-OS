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
          fontFamily: "'Inter', system-ui, sans-serif",
          background: "#0c0d0e",
          color: "#ededed",
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden
            style={{ marginBottom: 16 }}
          >
            <rect width="100" height="100" rx="24" fill="#141618" />
            <circle
              cx="50"
              cy="50"
              r="28"
              stroke="#ff7a1a"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="140 35"
            />
            <circle cx="50" cy="50" r="14" fill="#ff7a1a" />
            <circle cx="50" cy="22" r="4" fill="#ffffff" />
          </svg>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em" }}>
            My OS hit a problem
          </h1>
          <p style={{ fontSize: 14, color: "#9aa0a6", marginBottom: 20, lineHeight: 1.5 }}>
            An unexpected error stopped the page from loading. Your data is safe. Reload to try
            again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              background: "#ff7a1a",
              color: "#0c0d0e",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
