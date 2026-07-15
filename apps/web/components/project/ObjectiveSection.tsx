"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button, Input, Progress, Text } from "@myos/ui";
import { objectiveProgress, type Objective } from "@myos/core/project";

/**
 * ObjectiveSection (Sprint 2.8). Numeric key results — current/target with a
 * unit and a derived progress bar. Qualitative KRs are intentionally deferred.
 */
export function ObjectiveSection({
  projectId,
  objectives,
  onCreate,
  onUpdate,
}: {
  projectId: string;
  objectives: Objective[];
  onCreate?: (input: {
    projectId: string;
    title: string;
    targetValue: number;
    unit: string;
  }) => void;
  onUpdate?: (id: string, currentValue: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  const submit = () => {
    const value = Number(target);
    if (!title.trim() || !Number.isFinite(value) || value <= 0 || !onCreate) return;
    onCreate({ projectId, title: title.trim(), targetValue: value, unit: "" });
    setTitle("");
    setTarget("");
  };

  return (
    <div className="flex flex-col gap-3">
      {objectives.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          No objectives yet.
        </Text>
      ) : (
        objectives.map((o) => (
          <div key={o.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <Target size={14} aria-hidden className="text-fg-subtle" />
                <Text variant="body-s">{o.title}</Text>
              </span>
              <Text variant="caption" tone="subtle" className="tabular-nums">
                {o.currentValue}/{o.targetValue} {o.unit}
              </Text>
            </div>
            <Progress value={objectiveProgress(o)} />
            {onUpdate && (
              <input
                type="range"
                min={0}
                max={o.targetValue}
                value={o.currentValue}
                onChange={(e) => onUpdate(o.id, Number(e.target.value))}
                aria-label={`Update ${o.title}`}
                className="accent-accent"
              />
            )}
          </div>
        ))
      )}
      {onCreate && (
        <div className="flex gap-2 pt-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Objective…"
          />
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target"
            type="number"
            className="w-24"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!title.trim() || !target}
            onClick={submit}
          >
            <Plus size={14} aria-hidden />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
