"use client";

import { Badge, Text } from "@myos/ui";
import type { ExecutionRecord } from "@myos/core/automation";
import { OUTCOME_TONE } from "./automation-icons";

/**
 * AutomationHistory (Sprint 3.4). Read-only execution log — outcome, when, runtime.
 */
function time(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AutomationHistory({ records }: { records: ExecutionRecord[] }) {
  if (records.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No executions yet.
      </Text>
    );
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {records.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2 py-2">
          <Badge size="sm" variant={OUTCOME_TONE[r.outcome]}>
            {r.outcome.replace(/_/g, " ")}
          </Badge>
          <Text variant="caption" tone="subtle">
            {r.runtimeMs !== null ? `${r.runtimeMs}ms · ` : ""}
            {time(r.triggeredAt)}
          </Text>
        </li>
      ))}
    </ul>
  );
}
