"use client";

import { useState } from "react";
import { Eye, Play, Power } from "lucide-react";
import { Badge, Button, Text } from "@myos/ui";
import type { AutomationPreview as Preview, AutomationRule } from "@myos/core/automation";
import { TriggerEditor } from "./TriggerEditor";
import { ConditionBuilder } from "./ConditionBuilder";
import { ActionBuilder } from "./ActionBuilder";
import { ExecutionPolicyEditor } from "./ExecutionPolicyEditor";
import { AutomationPreview } from "./AutomationPreview";
import { STATUS_BADGE, STATUS_LABEL } from "./automation-icons";

/**
 * AutomationInspector (Sprint 3.4). The editorial detail view of a selected rule —
 * When → If → Then → How often → Preview — with run/toggle and a dry-run preview.
 */
export function AutomationInspector({
  rule,
  onToggle,
  onExecute,
  onPreview,
}: {
  rule: AutomationRule;
  onToggle: () => void;
  onExecute: () => void;
  onPreview: () => Promise<Preview>;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const enabled = rule.status === "enabled";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="heading-s">{rule.name}</Text>
        <Badge size="sm" variant={STATUS_BADGE[rule.status]}>
          {STATUS_LABEL[rule.status]}
        </Badge>
        {rule.builtIn ? (
          <Badge size="sm" variant="info">
            Built-in
          </Badge>
        ) : null}
      </div>
      {rule.description ? (
        <Text variant="body-s" tone="subtle">
          {rule.description}
        </Text>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary" onClick={onExecute}>
          <Play size={13} aria-hidden /> Run now
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggle}>
          <Power size={13} aria-hidden /> {enabled ? "Disable" : "Enable"}
        </Button>
        <Button size="sm" variant="ghost" onClick={async () => setPreview(await onPreview())}>
          <Eye size={13} aria-hidden /> Preview
        </Button>
      </div>

      <TriggerEditor kind={rule.trigger.kind} event={rule.trigger.event} />
      <ConditionBuilder conditions={rule.conditions} />
      <ActionBuilder actions={rule.actions} />
      <ExecutionPolicyEditor policy={rule.policy} />
      {preview ? <AutomationPreview preview={preview} /> : null}
    </div>
  );
}
