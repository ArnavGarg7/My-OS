"use client";

import { Play, Power, Trash2 } from "lucide-react";
import { Badge, Button, Text } from "@myos/ui";
import type { AutomationRule } from "@myos/core/automation";
import { PRIORITY_BADGE, STATUS_BADGE, STATUS_LABEL, TRIGGER_ICON } from "./automation-icons";

/**
 * AutomationCard (Sprint 3.4). Editorial list item — trigger, name, action count,
 * status, priority, with enable/disable, execute and (custom-only) delete actions.
 */
export function AutomationCard({
  rule,
  selected,
  onSelect,
  onToggle,
  onExecute,
  onDelete,
}: {
  rule: AutomationRule;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onExecute: () => void;
  onDelete: () => void;
}) {
  const Icon = TRIGGER_ICON[rule.trigger.kind];
  const enabled = rule.status === "enabled";
  return (
    <article
      className={`border-border flex flex-col gap-2 rounded-lg border p-3 ${
        selected ? "ring-accent ring-1" : ""
      }`}
    >
      <button type="button" onClick={onSelect} className="flex items-start gap-2 text-left">
        <Icon size={16} aria-hidden className="text-fg-subtle mt-0.5 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="body-m" className="font-medium">
              {rule.name}
            </Text>
            <Badge size="sm" variant={STATUS_BADGE[rule.status]}>
              {STATUS_LABEL[rule.status]}
            </Badge>
            <Badge size="sm" variant={PRIORITY_BADGE[rule.priority]}>
              {rule.priority}
            </Badge>
            {rule.builtIn ? (
              <Badge size="sm" variant="info">
                Built-in
              </Badge>
            ) : null}
          </div>
          <Text variant="caption" tone="subtle">
            {rule.trigger.kind} · {rule.trigger.event || "any"} → {rule.actions.length} action
            {rule.actions.length === 1 ? "" : "s"} · {rule.policy.policy}
          </Text>
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-1.5 pl-6">
        <Button size="sm" variant="secondary" onClick={onExecute}>
          <Play size={12} aria-hidden /> Run
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggle}>
          <Power size={12} aria-hidden /> {enabled ? "Disable" : "Enable"}
        </Button>
        {!rule.builtIn ? (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 size={12} aria-hidden /> Delete
          </Button>
        ) : null}
      </div>
    </article>
  );
}
