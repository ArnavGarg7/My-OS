"use client";

import Link from "next/link";
import { Activity, Flame } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing life slot (Sprint 4.2). Today's routine, medication, workout, habit
 * streak and readiness advice — read-only; every value is derived by the Life Platform.
 */
export function MorningLifeSection() {
  const summary = trpc.life.summary.useQuery();
  const readiness = trpc.life.readiness.useQuery();
  const s = summary.data;
  const r = readiness.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Activity size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {s
            ? `${s.habitsCompletedToday}/${s.activeHabits} habits done${r ? ` · readiness ${r.score}` : ""}`
            : "No life data yet"}
        </Text>
      </div>
      {s ? (
        <div className="flex flex-wrap items-center gap-2">
          {s.nextRoutine ? (
            <Badge size="sm" variant="neutral">
              Routine: {s.nextRoutine}
            </Badge>
          ) : null}
          {s.medicationDue ? (
            <Badge size="sm" variant="warning">
              Medication due
            </Badge>
          ) : null}
          <Badge size="sm" variant="neutral">
            {s.workoutsThisWeek} workouts this week
          </Badge>
          {s.bestStreak > 0 ? (
            <Badge size="sm" variant="accent">
              <Flame size={11} aria-hidden /> {s.bestStreak}-day streak
            </Badge>
          ) : null}
        </div>
      ) : null}
      {r ? (
        <Text variant="caption" tone="subtle">
          Advice — train: {r.trainingRecommendation} · work: {r.workRecommendation} · study:{" "}
          {r.studyRecommendation}
        </Text>
      ) : null}
      <Link href="/life" className="text-accent text-sm hover:underline">
        Open life →
      </Link>
    </div>
  );
}
