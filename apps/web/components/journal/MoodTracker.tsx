"use client";

import { cn } from "@myos/ui";
import { MOOD_LEVELS, type MoodLevel } from "@myos/core/journal";
import { MOOD_EMOJI, MOOD_LABEL } from "./journal-icons";

/**
 * MoodTracker (Sprint 2.10). A five-level mood picker. Presentational — the
 * chosen mood is written onto the entry / reflection by the caller.
 */
export function MoodTracker({
  value,
  onChange,
}: {
  value: MoodLevel | null;
  onChange: (mood: MoodLevel) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {MOOD_LEVELS.map((mood) => (
        <button
          key={mood}
          type="button"
          aria-label={MOOD_LABEL[mood]}
          aria-pressed={value === mood}
          onClick={() => onChange(mood)}
          className={cn(
            "border-border flex flex-col items-center gap-0.5 rounded-md border px-2 py-1.5 text-lg transition-colors",
            value === mood ? "border-accent bg-accent-muted/40" : "hover:bg-elevated",
          )}
        >
          <span aria-hidden>{MOOD_EMOJI[mood]}</span>
        </button>
      ))}
    </div>
  );
}
