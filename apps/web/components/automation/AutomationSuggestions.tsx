"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * AutomationSuggestions (Sprint 3.4). Surfaced inside Tomorrow Studio — a compact view
 * of scheduled automations + any pending rules to review before planning tomorrow.
 * Read-only; the Automation Engine owns execution.
 */
export function AutomationSuggestions() {
  const summary = trpc.automation.summary.useQuery();
  const list = trpc.automation.list.useQuery();
  const s = summary.data;
  const scheduled = (list.data ?? []).filter(
    (r) => r.status === "enabled" && r.policy.policy === "schedule",
  );

  if (!s || s.enabledRules === 0) return null;

  return (
    <section className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <span className="inline-flex items-center gap-1.5">
        <Zap size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
          Automation
        </Text>
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant="success">
          {s.enabledRules} active
        </Badge>
        {scheduled.length > 0 ? (
          <Badge size="sm" variant="accent">
            {scheduled.length} scheduled
          </Badge>
        ) : null}
        {s.pending > 0 ? (
          <Badge size="sm" variant="warning">
            {s.pending} pending
          </Badge>
        ) : null}
      </div>
      {scheduled.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {scheduled.slice(0, 3).map((r) => (
            <li key={r.id}>
              <Text variant="caption" tone="subtle">
                {r.name} · {r.policy.scheduleAt ?? ""}
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href="/automation" className="text-accent text-xs hover:underline">
        Manage automations →
      </Link>
    </section>
  );
}
