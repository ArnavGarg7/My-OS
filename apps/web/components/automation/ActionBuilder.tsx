"use client";

import { ArrowRight } from "lucide-react";
import { Text } from "@myos/ui";
import { summarizeAction, type Action } from "@myos/core/automation";

/**
 * ActionBuilder (Sprint 3.4). Editorial "then" section — the ordered actions that run
 * when the automation fires. Each action calls an existing service; the summary is
 * human-readable. Read-first.
 */
export function ActionBuilder({ actions }: { actions: Action[] }) {
  return (
    <section className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Then
      </Text>
      <ol className="border-border flex flex-col gap-1.5 rounded-lg border p-3">
        {actions.map((action, i) => (
          <li key={action.id} className="flex items-center gap-2">
            <span className="text-fg-subtle text-xs">{i + 1}</span>
            <ArrowRight size={12} aria-hidden className="text-fg-subtle" />
            <Text variant="body-s">{summarizeAction(action)}</Text>
          </li>
        ))}
      </ol>
    </section>
  );
}
