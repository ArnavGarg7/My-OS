"use client";

import { Text } from "@myos/ui";
import type { TriggerKind } from "@myos/core/automation";
import { TRIGGER_ICON } from "./automation-icons";

/**
 * TriggerEditor (Sprint 3.4). Editorial "when" section — the trigger kind + event
 * that fires the automation. Read-first; the section header reads like a sentence.
 */
export function TriggerEditor({ kind, event }: { kind: TriggerKind; event: string }) {
  const Icon = TRIGGER_ICON[kind];
  return (
    <section className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        When
      </Text>
      <div className="border-border flex items-center gap-2 rounded-lg border p-3">
        <Icon size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          <span className="font-medium capitalize">{kind}</span>
          {" · "}
          <span className="text-fg-muted">{event || "any event"}</span>
        </Text>
      </div>
    </section>
  );
}
