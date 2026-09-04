"use client";

import Link from "next/link";
import { selectActionable } from "@myos/core/decision";
import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar decision indicator. Shows the count of decisions genuinely waiting
 * on the user (pending, unexpired, one per rule) — the same number the Chief and
 * the Command Center use. Links to today's recommendation.
 */
export function DecisionStatusIndicator() {
  const list = trpc.today.listDecisions.useQuery({});
  const waiting = list.data ? selectActionable(list.data, new Date()).length : 0;
  return (
    <Link
      href="/today#morning-recommendation"
      className="hover:text-fg focus-visible:ring-ring flex items-center gap-1.5 rounded-sm outline-none transition-colors focus-visible:ring-1"
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${waiting > 0 ? "bg-warning" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Decisions</span>
      <span className="text-fg-muted font-medium">
        {waiting === 0 ? "clear" : `${waiting} waiting`}
      </span>
    </Link>
  );
}
