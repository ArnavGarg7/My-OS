"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@myos/ui";
import { GOAL_TYPES, type CreateGoalSchemaInput, type GoalType } from "@myos/core/goal";
import { GOAL_TYPE_LABEL } from "./goal-icons";

/**
 * GoalEditor (Sprint 2.12). Compose a new goal — title, type, description and an
 * optional target date.
 */
export function GoalEditor({
  onSave,
  onCancel,
}: {
  onSave: (input: CreateGoalSchemaInput) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("personal");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const save = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      goalType,
      priority: "medium",
      description: description.trim() || undefined,
      targetDate: targetDate || null,
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Goal title…"
        aria-label="Goal title"
      />
      <Select value={goalType} onValueChange={(v) => v && setGoalType(v as GoalType)}>
        <SelectTrigger aria-label="Goal type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GOAL_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {GOAL_TYPE_LABEL[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What outcome does this describe? (optional)"
        rows={2}
      />
      <Input
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        aria-label="Target date"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={!title.trim()} onClick={save}>
          Create goal
        </Button>
      </div>
    </div>
  );
}
