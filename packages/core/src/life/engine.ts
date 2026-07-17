import type { HabitFrequency, RoutineType } from "./constants";
import type { Habit, Routine, RoutineStep } from "./types";

/**
 * LifeEngine (Sprint 4.2). The pure coordinator that mints life entities with injected
 * ids + clock. It composes the habit/routine/health/growth modules; it holds no
 * persistence and no derivation logic (those live in their own pure modules).
 */
export interface LifeEngineDeps {
  newId: () => string;
  now: () => Date;
}

export class LifeEngine {
  constructor(private readonly deps: LifeEngineDeps) {}

  private iso(): string {
    return this.deps.now().toISOString();
  }

  makeHabit(input: {
    name: string;
    description?: string;
    frequency?: HabitFrequency;
    target?: number;
    daysOfWeek?: number[];
    goalId?: string | null;
    knowledgeNoteId?: string | null;
  }): Habit {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      description: input.description ?? "",
      frequency: input.frequency ?? "daily",
      target: input.target ?? 1,
      daysOfWeek: input.daysOfWeek ?? [],
      goalId: input.goalId ?? null,
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      archived: false,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  makeRoutine(input: {
    name: string;
    type?: RoutineType;
    startTime?: string | null;
    steps?: {
      title: string;
      durationMinutes?: number;
      linkedTaskId?: string | null;
      linkedHabitId?: string | null;
    }[];
    knowledgeNoteId?: string | null;
  }): Routine {
    const iso = this.iso();
    const routineId = this.deps.newId();
    const steps: RoutineStep[] = (input.steps ?? []).map((s, i) => ({
      id: this.deps.newId(),
      routineId,
      order: i,
      title: s.title.trim(),
      durationMinutes: s.durationMinutes ?? 5,
      linkedTaskId: s.linkedTaskId ?? null,
      linkedHabitId: s.linkedHabitId ?? null,
    }));
    return {
      id: routineId,
      name: input.name.trim(),
      type: input.type ?? "custom",
      status: "active",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
      startTime: input.startTime ?? null,
      steps,
      createdAt: iso,
      updatedAt: iso,
    };
  }
}

export function createLifeEngine(
  newId: () => string,
  now: () => Date = () => new Date(),
): LifeEngine {
  return new LifeEngine({ newId, now });
}
