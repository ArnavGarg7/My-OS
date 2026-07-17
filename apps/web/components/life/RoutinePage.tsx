"use client";

import type { UseLife } from "./use-life";
import { RoutineBuilder } from "./RoutineBuilder";
import { RoutineTimeline } from "./RoutineTimeline";

/**
 * RoutinePage (Sprint 4.2). The routines surface — build routines and run them. The
 * Planner materializes them into blocks without owning the definitions.
 */
export function RoutinePage({ life }: { life: UseLife }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <RoutineBuilder onCreate={life.createRoutine} />
      <RoutineTimeline routines={life.routines} onComplete={life.completeRoutine} />
    </div>
  );
}
