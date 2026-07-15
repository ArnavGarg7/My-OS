"use client";

import { trpc } from "@/lib/trpc/client";
import { STATUS_LABEL } from "./focus-icons";
import { formatMinutes } from "./format";

/**
 * Status-bar Focus indicator (Sprint 3.2): "Focus · Running · 32m left" or, when
 * idle, "Focus · 90m deep work today". Replaces the earlier Today focus placeholder.
 * Provider-driven via focus.summary.
 */
export function FocusStatusIndicator() {
  const summary = trpc.focus.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          s.status === "running"
            ? "bg-success"
            : s.status === "paused" || s.status === "break"
              ? "bg-warning"
              : "bg-fg-subtle"
        }`}
      />
      <span className="text-fg-subtle">Focus</span>
      {s.active ? (
        <>
          <span className="text-fg-muted font-medium">{STATUS_LABEL[s.status]}</span>
          <span className="text-fg-muted">· {s.remainingMinutes}m left</span>
        </>
      ) : (
        <span className="text-fg-muted">· {formatMinutes(s.deepWorkMinutesToday)} deep work</span>
      )}
    </div>
  );
}
