"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@myos/shared/format";
import { useDecisions } from "./use-decisions";

/**
 * Decision context panel (Sprint 2.3). Replaces the recommendation widget with
 * the current decision + priority + remaining time + confidence.
 */
function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <div className="text-label text-fg-subtle">{label}</div>
      <div className={`text-body-m text-fg ${capitalize ? "capitalize" : ""}`}>{value}</div>
    </div>
  );
}

export function DecisionContextPanel() {
  const { current } = useDecisions();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const remaining = current?.expiresAt ? formatRelativeTime(current.expiresAt) : "—";

  return (
    <div className="flex flex-col gap-5 p-4">
      <Row label="Current time" value={time} />
      <Row label="Current decision" value={current?.title ?? "None right now"} />
      <Row label="Priority" value={current?.priority ?? "—"} capitalize />
      <Row label="Remaining time" value={remaining} />
      <Row label="Confidence" value={current ? `${current.confidence}%` : "—"} />
    </div>
  );
}
