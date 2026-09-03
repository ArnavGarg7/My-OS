"use client";

import { Progress, Text } from "@myos/ui";
import type { usePlanner } from "./use-planner";
import { PlannerMiniCalendar } from "./PlannerMiniCalendar";

/** Planner sidebar (Sprint 2.6): utilization, conflicts, calendar. The colour key lives in the
 *  interactive filters above the timeline, so a separate static legend here would just duplicate it. */
export function PlannerSidebar({ planner }: { planner: ReturnType<typeof usePlanner> }) {
  const util = planner.utilization;
  return (
    <div className="flex flex-col gap-5 p-4">
      <section className="flex flex-col gap-2">
        <Text variant="label" tone="subtle">
          Utilization
        </Text>
        <Progress value={util?.percentUtilized ?? 0} />
        <Text variant="caption" tone="subtle">
          {util?.percentUtilized ?? 0}% · {util?.freeMinutes ?? 0} min free
        </Text>
      </section>

      <section className="flex flex-col gap-1">
        <Text variant="label" tone="subtle">
          Conflicts
        </Text>
        <Text variant="body-s" tone={planner.conflicts.length > 0 ? "default" : "subtle"}>
          {planner.conflicts.length === 0
            ? "None — plan is clean."
            : `${planner.conflicts.length} to review`}
        </Text>
      </section>

      <PlannerMiniCalendar date={planner.day?.date} />
    </div>
  );
}
