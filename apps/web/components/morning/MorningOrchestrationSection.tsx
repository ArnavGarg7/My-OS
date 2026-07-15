"use client";

import Link from "next/link";
import { Workflow } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing orchestration slot (Sprint 3.5). A one-line system-health read: is
 * every engine cooperating, how many cross-module runs happened, and whether anything
 * needs attention. Read-only; the Orchestration Engine decided what ran.
 */
export function MorningOrchestrationSection() {
  const summary = trpc.orchestration.summary.useQuery();
  const s = summary.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Workflow size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {s
            ? s.systemReady
              ? `System ready · ${s.runsToday} run${s.runsToday === 1 ? "" : "s"} today`
              : "System needs attention"
            : "No orchestration runs yet"}
        </Text>
      </div>
      {s && (s.failuresToday > 0 || s.recoveriesToday > 0) ? (
        <div className="flex flex-wrap items-center gap-2">
          {s.recoveriesToday > 0 ? (
            <Badge size="sm" variant="warning">
              {s.recoveriesToday} recovered
            </Badge>
          ) : null}
          {s.failuresToday > 0 ? (
            <Badge size="sm" variant="danger">
              {s.failuresToday} failed
            </Badge>
          ) : null}
        </div>
      ) : null}
      <Link href="/orchestration" className="text-accent text-sm hover:underline">
        Open orchestration →
      </Link>
    </div>
  );
}
