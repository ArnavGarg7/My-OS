"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";
import { parseGoal, type CreateGoalSchemaInput } from "@myos/core/goal";

/**
 * QuickGoal (Sprint 2.12). One-line capture parsed deterministically into a goal
 * type, optional habit frequency and target date. "Graduate by 2027 #education".
 */
export function QuickGoal({ onCreate }: { onCreate: (input: CreateGoalSchemaInput) => void }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    const parsed = parseGoal(text);
    onCreate({
      title: parsed.title,
      goalType: parsed.goalType,
      priority: "medium",
      targetDate: parsed.targetDate,
    });
    setText("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Graduate by 2027 #education"
          aria-label="Quick goal"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button disabled={!text.trim()} onClick={submit}>
          <Plus size={14} aria-hidden />
          Add
        </Button>
      </div>
      <Text variant="caption" tone="subtle">
        Tip: add #career/#health and "by 2027" to set type + target.
      </Text>
    </div>
  );
}
