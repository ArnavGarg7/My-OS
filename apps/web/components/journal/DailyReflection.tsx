"use client";

import { useState } from "react";
import { Button, Input, Textarea, Text } from "@myos/ui";
import { WinsSection } from "./WinsSection";
import { LessonsSection } from "./LessonsSection";
import { GratitudeSection } from "./GratitudeSection";

export interface ReflectionDraft {
  reflection: string;
  wins: string[];
  lessons: string[];
  gratitude: string[];
  tomorrowFocus: string;
}

/**
 * DailyReflection (Sprint 2.10). The structured evening reflection: prose +
 * wins + lessons + gratitude + tomorrow's focus. Saved as one daily record.
 */
export function DailyReflection({
  initial,
  onSave,
  pending,
}: {
  initial?: Partial<ReflectionDraft>;
  onSave: (draft: ReflectionDraft) => void;
  pending?: boolean;
}) {
  const [reflection, setReflection] = useState(initial?.reflection ?? "");
  const [wins, setWins] = useState<string[]>(initial?.wins ?? []);
  const [lessons, setLessons] = useState<string[]>(initial?.lessons ?? []);
  const [gratitude, setGratitude] = useState<string[]>(initial?.gratitude ?? []);
  const [tomorrowFocus, setTomorrowFocus] = useState(initial?.tomorrowFocus ?? "");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Text variant="label" tone="subtle">
          Reflection
        </Text>
        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How did today go?"
          rows={4}
        />
      </div>

      <WinsSection items={wins} onChange={setWins} />
      <LessonsSection items={lessons} onChange={setLessons} />
      <GratitudeSection items={gratitude} onChange={setGratitude} />

      <div className="flex flex-col gap-1.5">
        <Text variant="label" tone="subtle">
          Tomorrow's focus
        </Text>
        <Input
          value={tomorrowFocus}
          onChange={(e) => setTomorrowFocus(e.target.value)}
          placeholder="The one thing that matters tomorrow…"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onSave({ reflection, wins, lessons, gratitude, tomorrowFocus })}
          loading={pending ?? false}
        >
          Save reflection
        </Button>
      </div>
    </div>
  );
}
