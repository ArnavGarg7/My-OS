"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing automation slot (Sprint 3.4). A summary of what your rules did —
 * rules executed overnight, failures and any pending approvals. Read-only; the
 * Automation Engine decided what ran. Links to the full center.
 */
export function MorningAutomationSection() {
  const summary = trpc.automation.summary.useQuery();
  const s = summary.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Zap size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {s
            ? `${s.enabledRules} rule${s.enabledRules === 1 ? "" : "s"} active · ${s.executedToday} ran today`
            : "No automations yet"}
        </Text>
      </div>
      {s && (s.failedToday > 0 || s.pending > 0) ? (
        <div className="flex flex-wrap items-center gap-2">
          {s.failedToday > 0 ? (
            <Badge size="sm" variant="danger">
              {s.failedToday} failed
            </Badge>
          ) : null}
          {s.pending > 0 ? (
            <Badge size="sm" variant="warning">
              {s.pending} pending approval
            </Badge>
          ) : null}
        </div>
      ) : null}
      <Link href="/automation" className="text-accent text-sm hover:underline">
        Open automation →
      </Link>
    </div>
  );
}
