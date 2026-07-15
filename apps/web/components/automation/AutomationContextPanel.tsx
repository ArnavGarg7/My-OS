"use client";

import { Zap } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { OUTCOME_TONE } from "./automation-icons";

/**
 * Automation context panel (Sprint 3.4). Route-aware snapshot on /automation — active
 * rules, executions today, failures, pending approvals and recent runs.
 */
export function AutomationContextPanel() {
  const summary = trpc.automation.summary.useQuery();
  const history = trpc.automation.history.useQuery({ limit: 5 });
  const s = summary.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Zap size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Automation</Text>
      </span>

      {s ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" variant="success">
              {s.enabledRules} active
            </Badge>
            <Badge size="sm" variant="neutral">
              {s.executedToday} today
            </Badge>
            {s.failedToday > 0 ? (
              <Badge size="sm" variant="danger">
                {s.failedToday} failed
              </Badge>
            ) : null}
            {s.pending > 0 ? (
              <Badge size="sm" variant="warning">
                {s.pending} pending
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}

      {(history.data ?? []).length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Recent runs
          </Text>
          {(history.data ?? []).map((r) => (
            <span key={r.id} className="flex items-center justify-between gap-2">
              <Badge size="sm" variant={OUTCOME_TONE[r.outcome]}>
                {r.outcome.replace(/_/g, " ")}
              </Badge>
              <Text variant="caption" tone="subtle">
                {r.runtimeMs !== null ? `${r.runtimeMs}ms` : ""}
              </Text>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
