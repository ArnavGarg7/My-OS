"use client";

import { useState } from "react";
import { Button, Input } from "@myos/ui";
import type { HabitFrequency } from "@myos/core/life";

/**
 * HabitEditor (Sprint 4.2). Add a habit — name + frequency. Streaks and consistency are
 * derived, never entered.
 */
export function HabitEditor({
  onCreate,
}: {
  onCreate: (input: { name: string; frequency?: HabitFrequency; target?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");

  return (
    <div className="flex items-end gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New habit…"
        aria-label="Habit name"
      />
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
        aria-label="Habit frequency"
        className="border-border-subtle bg-surface h-9 rounded-md border px-2 text-sm"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="custom">Custom</option>
      </select>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          if (!name.trim()) return;
          onCreate({ name: name.trim(), frequency });
          setName("");
        }}
      >
        Add
      </Button>
    </div>
  );
}
