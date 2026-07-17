"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";

/**
 * RoutineBuilder (Sprint 4.2). Compose a routine from ordered steps. The routine
 * definition is the single source of truth; the Planner materializes it separately.
 */
export function RoutineBuilder({
  onCreate,
}: {
  onCreate: (input: {
    name: string;
    steps?: { title: string; durationMinutes?: number }[];
  }) => void;
}) {
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<{ title: string; durationMinutes: number }[]>([]);
  const [stepTitle, setStepTitle] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Routine name…"
        aria-label="Routine name"
      />
      <div className="flex items-end gap-2">
        <Input
          value={stepTitle}
          onChange={(e) => setStepTitle(e.target.value)}
          placeholder="Add a step…"
          aria-label="Step title"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (!stepTitle.trim()) return;
            setSteps([...steps, { title: stepTitle.trim(), durationMinutes: 10 }]);
            setStepTitle("");
          }}
        >
          <Plus size={13} aria-hidden /> Step
        </Button>
      </div>
      {steps.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {steps.map((s, i) => (
            <li
              key={i}
              className="border-border-subtle flex items-center justify-between rounded border px-2 py-1"
            >
              <Text variant="caption">
                {i + 1}. {s.title} · {s.durationMinutes}m
              </Text>
              <button
                type="button"
                onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                aria-label="Remove step"
              >
                <X size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          if (!name.trim()) return;
          onCreate({ name: name.trim(), steps });
          setName("");
          setSteps([]);
        }}
      >
        Create routine
      </Button>
    </div>
  );
}
