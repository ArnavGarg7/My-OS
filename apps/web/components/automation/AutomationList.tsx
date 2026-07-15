"use client";

import { Text } from "@myos/ui";
import type { AutomationRule } from "@myos/core/automation";
import { AutomationCard } from "./AutomationCard";

/** AutomationList (Sprint 3.4). Renders rule cards or an empty state. */
export function AutomationList({
  rules,
  selectedId,
  onSelect,
  onToggle,
  onExecute,
  onDelete,
}: {
  rules: AutomationRule[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (rule: AutomationRule) => void;
  onExecute: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (rules.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No automations yet. Create one to let your OS run itself.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {rules.map((rule) => (
        <AutomationCard
          key={rule.id}
          rule={rule}
          selected={selectedId === rule.id}
          onSelect={() => onSelect(rule.id)}
          onToggle={() => onToggle(rule)}
          onExecute={() => onExecute(rule.id)}
          onDelete={() => onDelete(rule.id)}
        />
      ))}
    </div>
  );
}
