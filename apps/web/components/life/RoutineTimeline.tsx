"use client";

import { Check } from "lucide-react";
import { Badge, Button, Card, EmptyState, Text } from "@myos/ui";
import { totalDuration, type Routine } from "@myos/core/life";
import { ROUTINE_TYPE_LABEL, RoutineIcon, StepsIcon } from "./life-icons";

/**
 * RoutineTimeline (Sprint 4.2). Lists routines with their ordered steps + total duration
 * and a "complete" action. The Planner materializes these into blocks (see server).
 */
export function RoutineTimeline({
  routines,
  onComplete,
}: {
  routines: Routine[];
  onComplete: (id: string) => void;
}) {
  if (routines.length === 0) {
    return (
      <EmptyState
        icon={RoutineIcon}
        title="No routines yet"
        description="Build a morning or evening routine."
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {routines.map((r) => (
        <Card key={r.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RoutineIcon size={15} aria-hidden className="text-fg-subtle" />
              <Text variant="body-m">{r.name}</Text>
              <Badge size="sm" variant="neutral">
                {ROUTINE_TYPE_LABEL[r.type]}
              </Badge>
              {r.startTime ? (
                <Text variant="caption" tone="subtle">
                  {r.startTime}
                </Text>
              ) : null}
            </div>
            <Button size="sm" variant="secondary" onClick={() => onComplete(r.id)}>
              <Check size={13} aria-hidden /> Complete
            </Button>
          </div>
          <ul className="flex flex-col gap-0.5">
            {r.steps.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <StepsIcon size={11} aria-hidden className="text-fg-subtle" />
                <Text variant="caption" tone="subtle">
                  {s.title} · {s.durationMinutes}m
                </Text>
              </li>
            ))}
          </ul>
          <Text variant="caption" tone="subtle">
            {totalDuration(r)} min total
          </Text>
        </Card>
      ))}
    </div>
  );
}
