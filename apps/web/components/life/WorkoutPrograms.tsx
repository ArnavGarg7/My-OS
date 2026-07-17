"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Text } from "@myos/ui";
import { sessionVolume, trainingLoad, type WorkoutSession } from "@myos/core/life";

/**
 * WorkoutPrograms (Sprint 4.2). Log a workout (perceived exertion + notes) and see recent
 * sessions with derived volume, plus this week's training load. Deterministic.
 */
export function WorkoutPrograms({
  workouts,
  onLog,
}: {
  workouts: WorkoutSession[];
  onLog: (input: { perceivedExertion?: number; recoveryNotes?: string }) => void;
}) {
  const [rpe, setRpe] = useState("7");
  const [notes, setNotes] = useState("");
  const load = trainingLoad(workouts, new Date());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant={load.high ? "danger" : "accent"}>
          Weekly load: {load.weeklyVolume}
        </Badge>
        <Badge size="sm" variant="neutral">
          {load.sessions} sessions
        </Badge>
        <Badge size="sm" variant="neutral">
          Avg RPE {load.averageIntensity}
        </Badge>
      </div>
      <div className="flex items-end gap-2">
        <Input
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          placeholder="RPE"
          aria-label="Perceived exertion"
          className="w-20"
        />
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Recovery notes"
          aria-label="Recovery notes"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            onLog({
              perceivedExertion: Math.min(10, Math.max(1, Number(rpe) || 7)),
              recoveryNotes: notes.trim(),
            });
            setNotes("");
          }}
        >
          Log workout
        </Button>
      </div>
      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          description="Log a session to track training load."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {workouts.slice(0, 8).map((w) => (
            <Card key={w.id} className="flex items-center justify-between gap-2 p-3">
              <Text variant="body-s">{w.date}</Text>
              <Text variant="caption" tone="subtle">
                Volume {sessionVolume(w)} · RPE {w.perceivedExertion}
              </Text>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
