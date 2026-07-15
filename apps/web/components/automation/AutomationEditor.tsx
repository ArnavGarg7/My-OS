"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";
import {
  ACTION_KINDS,
  EXECUTION_POLICIES,
  TRIGGER_KINDS,
  summarizeAction,
  type ActionKind,
  type AutomationDraft,
  type ExecutionPolicy,
  type TriggerKind,
} from "@myos/core/automation";

/**
 * AutomationEditor (Sprint 3.4). Editorial create form — readable top to bottom:
 * name → trigger → action → policy. No node graph, no drag-and-drop. Composable
 * conditions are added later via the inspector; new rules start with none (always run).
 */
export function AutomationEditor({
  onCreate,
  pending,
}: {
  onCreate: (draft: AutomationDraft) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerKind>("planner");
  const [event, setEvent] = useState("planner.generated");
  const [action, setAction] = useState<ActionKind>("generate_notification");
  const [policy, setPolicy] = useState<ExecutionPolicy>("run_always");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      trigger: { kind: trigger, event: event.trim() },
      actions: [{ id: "a1", kind: action, params: {}, order: 0 }],
      policy: { policy },
    });
    setName("");
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <Text variant="heading-s">New automation</Text>

      <label className="flex flex-col gap-1">
        <Text variant="caption" tone="subtle">
          Name
        </Text>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Meeting → pause focus"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            When (trigger)
          </Text>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as TriggerKind)}
            className="border-border bg-elevated rounded-md border px-2 py-1.5 text-sm"
          >
            {TRIGGER_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            Event (blank = any)
          </Text>
          <Input
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="planner.generated"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            Then (action)
          </Text>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionKind)}
            className="border-border bg-elevated rounded-md border px-2 py-1.5 text-sm"
          >
            {ACTION_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            How often (policy)
          </Text>
          <select
            value={policy}
            onChange={(e) => setPolicy(e.target.value as ExecutionPolicy)}
            className="border-border bg-elevated rounded-md border px-2 py-1.5 text-sm"
          >
            {EXECUTION_POLICIES.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Text variant="caption" tone="subtle">
        {summarizeAction({ id: "a1", kind: action, params: {}, order: 0 })}
      </Text>

      <Button onClick={submit} disabled={pending || !name.trim()}>
        <Plus size={14} aria-hidden /> Create automation
      </Button>
    </div>
  );
}
