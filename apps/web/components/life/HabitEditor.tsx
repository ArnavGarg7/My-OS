"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, MonoLabel, cn } from "@myos/ui";
import { HABIT_FREQUENCIES, HABIT_SUGGESTIONS, type HabitFrequency } from "@myos/core/life";

const FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom",
};

/**
 * HabitEditor (Sprint 4.2). Add a habit — name + a tappable frequency, with a row of common
 * suggestions for a one-tap start. Streaks and consistency are derived, never entered.
 */
export function HabitEditor({
  onCreate,
}: {
  onCreate: (input: { name: string; frequency?: HabitFrequency; target?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");

  const add = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), frequency });
    setName("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {HABIT_FREQUENCIES.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={frequency === f}
            onClick={() => setFrequency(f)}
            className={cn(
              "text-caption rounded-md border px-2.5 py-1",
              frequency === f
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
            )}
          >
            {FREQUENCY_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit…"
          aria-label="Habit name"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button size="sm" variant="secondary" onClick={add} disabled={!name.trim()}>
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <MonoLabel tone="subtle">Or add a common one</MonoLabel>
        <div className="flex flex-wrap gap-1.5">
          {HABIT_SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => onCreate({ name: s.name, frequency: s.frequency })}
              className="border-border text-body-s hover:border-accent hover:bg-elevated inline-flex items-center gap-1 rounded-md border px-2.5 py-1"
            >
              <Plus size={12} aria-hidden className="text-fg-subtle" />
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
