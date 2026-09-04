"use client";

import { History } from "lucide-react";
import { Badge, EmptyState, Text } from "@myos/ui";
import type { FocusSession } from "@myos/core/focus";
import { SESSION_TYPE_LABEL, STATUS_LABEL } from "./focus-icons";
import { formatMinutes } from "./format";

/**
 * FocusHistory (Sprint 3.2). A compact list of recent sessions — type, length,
 * outcome. Read-only reflection of what actually happened.
 */
function sessionMinutes(s: FocusSession): number {
  if (!s.startedAt || !s.endedAt) return 0;
  const span = Date.parse(s.endedAt) - Date.parse(s.startedAt) - s.pausedDurationMs;
  return Math.max(0, Math.floor(span / 60_000));
}

export function FocusHistory({ sessions }: { sessions: FocusSession[] }) {
  const finished = sessions.filter((s) => s.endedAt !== null);
  if (finished.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No sessions logged yet"
        description="Finished focus sessions land here — length, interruptions, and outcome. Start one above and it becomes part of today's record."
        className="border-border rounded-lg border border-dashed py-8"
      />
    );
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {finished.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-2 py-2">
          <div className="flex flex-col">
            <Text variant="body-s">{SESSION_TYPE_LABEL[s.type]}</Text>
            <Text variant="caption" tone="subtle">
              {formatMinutes(sessionMinutes(s))} · {s.interruptions.length} interruptions
            </Text>
          </div>
          <Badge size="sm" variant={s.completed ? "success" : "neutral"}>
            {STATUS_LABEL[s.status]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
