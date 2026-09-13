"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@myos/ui";
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

/** Readable label from an enum token, e.g. "generate_notification" -> "Generate notification". */
const label = (k: string) => {
  const t = k.replace(/_/g, " ");
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
};

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
          <Select value={trigger} onValueChange={(v) => v && setTrigger(v as TriggerKind)}>
            <SelectTrigger aria-label="Trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {label(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={action} onValueChange={(v) => v && setAction(v as ActionKind)}>
            <SelectTrigger aria-label="Action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {label(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            How often (policy)
          </Text>
          <Select value={policy} onValueChange={(v) => v && setPolicy(v as ExecutionPolicy)}>
            <SelectTrigger aria-label="Policy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXECUTION_POLICIES.map((k) => (
                <SelectItem key={k} value={k}>
                  {label(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
