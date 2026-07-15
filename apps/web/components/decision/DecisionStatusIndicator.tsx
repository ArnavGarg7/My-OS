"use client";

import { selectDecisionStatus } from "@myos/core/decision";
import { trpc } from "@/lib/trpc/client";

/** "Decision · Pending/Accepted/Deferred/Idle" indicator for the status bar. */
export function DecisionStatusIndicator() {
  const list = trpc.today.listDecisions.useQuery({});
  const status = selectDecisionStatus(list.data ?? []);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-fg-subtle">Decision</span>
      <span className="text-fg-muted font-medium capitalize">{status}</span>
    </div>
  );
}
