"use client";

import { Activity } from "lucide-react";
import { Badge, StatBlock, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { RECOMMENDATION_LABEL } from "./life-icons";

/**
 * Life context panel (Sprint 4.2). Route-aware snapshot on /life — readiness, habit
 * progress, next routine, medication + workout status. Read-only.
 */
export function LifeContextPanel() {
  const summary = trpc.life.summary.useQuery();
  const readiness = trpc.life.readiness.useQuery();
  const s = summary.data;
  const r = readiness.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Activity size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Life</Text>
      </span>

      {r ? (
        <div className="grid grid-cols-2 gap-2">
          <StatBlock label="Readiness" value={String(r.score)} />
          <StatBlock label="Recovery" value={String(r.recovery)} />
        </div>
      ) : null}

      {s ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="accent">
            {s.habitsCompletedToday}/{s.activeHabits} habits
          </Badge>
          {s.nextRoutine ? (
            <Badge size="sm" variant="neutral">
              Next: {s.nextRoutine}
            </Badge>
          ) : null}
          {s.medicationDue ? (
            <Badge size="sm" variant="warning">
              Meds due
            </Badge>
          ) : null}
          <Badge size="sm" variant="neutral">
            {s.workoutsThisWeek} workouts/wk
          </Badge>
        </div>
      ) : null}

      {r ? (
        <Text variant="caption" tone="subtle">
          Training advice: {RECOMMENDATION_LABEL[r.trainingRecommendation]}
        </Text>
      ) : null}
    </div>
  );
}
