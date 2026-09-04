"use client";

import Link from "next/link";
import { selectDecisionStatus } from "@myos/core/decision";
import { trpc } from "@/lib/trpc/client";

/**
 * "Decision · Pending/Accepted/Deferred/Idle" indicator for the status bar.
 * Links to today's recommendation.
 */
export function DecisionStatusIndicator() {
  const list = trpc.today.listDecisions.useQuery({});
  const status = selectDecisionStatus(list.data ?? []);
  const pending = status === "pending";
  return (
    <Link
      href="/today#morning-recommendation"
      className="hover:text-fg focus-visible:ring-ring flex items-center gap-1.5 rounded-sm outline-none transition-colors focus-visible:ring-1"
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${pending ? "bg-warning" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Decision</span>
      <span className="text-fg-muted font-medium capitalize">{status}</span>
    </Link>
  );
}
