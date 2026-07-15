"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";
import { overdueMilestones, sortMilestones, type Milestone } from "@myos/core/project";
import { MilestoneCard } from "./MilestoneCard";

/**
 * MilestoneList (Sprint 2.8). Ordered milestones with an inline add form and a
 * complete action. Ordering + overdue detection come from the pure engine.
 */
export function MilestoneList({
  projectId,
  milestones,
  onCreate,
  onComplete,
}: {
  projectId: string;
  milestones: Milestone[];
  onCreate?: (input: { projectId: string; title: string; dueDate?: string | null }) => void;
  onComplete?: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const overdue = new Set(overdueMilestones(milestones, new Date()).map((m) => m.id));
  const sorted = sortMilestones(milestones);

  const submit = () => {
    if (!title.trim() || !onCreate) return;
    onCreate({ projectId, title: title.trim() });
    setTitle("");
  };

  return (
    <div className="flex flex-col gap-2">
      {sorted.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          No milestones yet.
        </Text>
      ) : (
        sorted.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            overdue={overdue.has(m.id)}
            onComplete={onComplete}
          />
        ))
      )}
      {onCreate && (
        <div className="flex gap-2 pt-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a milestone…"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button size="sm" variant="secondary" disabled={!title.trim()} onClick={submit}>
            <Plus size={14} aria-hidden />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
