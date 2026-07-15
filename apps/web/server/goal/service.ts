import "server-only";
import {
  completeHabit as engineCompleteHabit,
  computeStreaks,
  createReview,
  goalEngine,
  updateKeyResult as engineUpdateKeyResult,
  type CreateGoalSchemaInput,
  type Goal,
  type GoalLink,
  type GoalLinkTarget,
  type GoalReview,
  type GoalStatus,
  type GoalType,
  type Habit,
  type KeyResult,
  type Objective,
  type ReviewPeriod,
} from "@myos/core/goal";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import {
  goalRowToGoal,
  habitRowToHabit,
  keyResultRowToKeyResult,
  linkRowToLinks,
  linkToColumns,
  objectiveRowToObjective,
  reviewRowToReview,
} from "./mapper";

/**
 * GoalService (Sprint 2.12). Bridges the pure GoalEngine with persistence.
 * Progress / forecast / portfolio are derived on read. Goals are outcomes.
 */
async function hydrate(
  db: Database,
  goalRows: Awaited<ReturnType<typeof repo.listGoals>>,
): Promise<Goal[]> {
  const ids = goalRows.map((g) => g.id);
  const [objectiveRows, habitRows, linkRows] = await Promise.all([
    repo.listObjectives(db, ids),
    repo.listHabits(db),
    repo.listLinks(db, ids),
  ]);
  const krRows = await repo.listKeyResults(
    db,
    objectiveRows.map((o) => o.id),
  );

  const krByObjective = new Map<string, KeyResult[]>();
  for (const kr of krRows) {
    const list = krByObjective.get(kr.objectiveId) ?? [];
    list.push(keyResultRowToKeyResult(kr));
    krByObjective.set(kr.objectiveId, list);
  }
  const objByGoal = new Map<string, Objective[]>();
  for (const o of objectiveRows) {
    const list = objByGoal.get(o.goalId) ?? [];
    list.push(objectiveRowToObjective(o, krByObjective.get(o.id) ?? []));
    objByGoal.set(o.goalId, list);
  }
  const habitByGoal = new Map<string, Habit[]>();
  for (const h of habitRows) {
    if (!h.goalId) continue;
    const list = habitByGoal.get(h.goalId) ?? [];
    list.push(habitRowToHabit(h));
    habitByGoal.set(h.goalId, list);
  }
  const linkByGoal = new Map<string, GoalLink[]>();
  for (const l of linkRows) {
    linkByGoal.set(l.goalId, [...(linkByGoal.get(l.goalId) ?? []), ...linkRowToLinks(l)]);
  }

  return goalRows.map((row) =>
    goalRowToGoal(
      row,
      objByGoal.get(row.id) ?? [],
      habitByGoal.get(row.id) ?? [],
      linkByGoal.get(row.id) ?? [],
    ),
  );
}

export async function list(db: Database, status?: GoalStatus): Promise<Goal[]> {
  return hydrate(db, await repo.listGoals(db, status));
}

export async function get(db: Database, id: string): Promise<Goal> {
  const row = await repo.getGoal(db, id);
  if (!row) throw new Error("Goal not found");
  const [goal] = await hydrate(db, [row]);
  return goal!;
}

export async function create(db: Database, input: CreateGoalSchemaInput): Promise<Goal> {
  const draft = goalEngine.create(
    {
      title: input.title,
      description: input.description,
      goalType: input.goalType,
      priority: input.priority,
      targetDate: input.targetDate,
    },
    new Date(),
  );
  const errors = goalEngine.validate(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const row = await repo.insertGoal(db, {
    title: draft.title,
    description: draft.description,
    goalType: draft.goalType,
    priority: draft.priority,
    targetDate: draft.targetDate,
  });
  return goalRowToGoal(row);
}

export async function update(
  db: Database,
  input: {
    id: string;
    title?: string | undefined;
    description?: string | undefined;
    goalType?: GoalType | undefined;
    status?: GoalStatus | undefined;
    priority?: Goal["priority"] | undefined;
    targetDate?: string | null | undefined;
  },
): Promise<Goal> {
  const current = await get(db, input.id);
  const now = new Date();
  let next: Goal = {
    ...current,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.goalType !== undefined ? { goalType: input.goalType } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.targetDate !== undefined ? { targetDate: input.targetDate } : {}),
    updatedAt: now.toISOString(),
  };
  if (input.status !== undefined && input.status !== current.status) {
    next = goalEngine.setStatus(next, input.status, now);
  }
  const row = await repo.updateGoal(db, input.id, {
    title: next.title,
    description: next.description,
    goalType: next.goalType,
    status: next.status,
    priority: next.priority,
    targetDate: next.targetDate,
    startedAt: next.startedAt ? new Date(next.startedAt) : null,
    completedAt: next.completedAt ? new Date(next.completedAt) : null,
    updatedAt: now,
  });
  return goalRowToGoal(row);
}

export async function archive(db: Database, id: string): Promise<Goal> {
  const row = await repo.updateGoal(db, id, { status: "archived", updatedAt: new Date() });
  return goalRowToGoal(row);
}

// --- objectives + key results ---
export async function createObjective(
  db: Database,
  input: { goalId: string; title: string; description?: string | undefined; weight: number },
): Promise<Objective> {
  const row = await repo.insertObjective(db, {
    goalId: input.goalId,
    title: input.title,
    description: input.description ?? "",
    weight: input.weight,
  });
  return objectiveRowToObjective(row);
}

export async function objectives(db: Database, goalId: string): Promise<Objective[]> {
  const objectiveRows = await repo.listObjectives(db, [goalId]);
  const krRows = await repo.listKeyResults(
    db,
    objectiveRows.map((o) => o.id),
  );
  const byObjective = new Map<string, KeyResult[]>();
  for (const kr of krRows) {
    byObjective.set(kr.objectiveId, [
      ...(byObjective.get(kr.objectiveId) ?? []),
      keyResultRowToKeyResult(kr),
    ]);
  }
  return objectiveRows.map((o) => objectiveRowToObjective(o, byObjective.get(o.id) ?? []));
}

export async function createKeyResult(
  db: Database,
  input: {
    objectiveId: string;
    title: string;
    metricType: KeyResult["metricType"];
    targetValue: number;
    currentValue: number;
    unit: string;
  },
): Promise<KeyResult> {
  const row = await repo.insertKeyResult(db, input);
  return keyResultRowToKeyResult(row);
}

export async function updateKeyResultValue(
  db: Database,
  input: { id: string; currentValue: number },
): Promise<KeyResult> {
  const row = await repo.getKeyResult(db, input.id);
  if (!row) throw new Error("Key result not found");
  const next = engineUpdateKeyResult(keyResultRowToKeyResult(row), input.currentValue);
  const updated = await repo.updateKeyResultRow(db, input.id, {
    currentValue: next.currentValue,
    status: next.status,
  });
  return keyResultRowToKeyResult(updated);
}

// --- habits ---
export async function habits(db: Database): Promise<Habit[]> {
  return (await repo.listHabits(db)).map(habitRowToHabit);
}

export async function createHabit(
  db: Database,
  input: { goalId: string | null; title: string; frequency: Habit["frequency"]; target: number },
): Promise<Habit> {
  return habitRowToHabit(await repo.insertHabit(db, input));
}

export async function completeHabit(
  db: Database,
  input: { id: string; date?: string | undefined },
  _tz: string,
): Promise<Habit> {
  const row = await repo.getHabit(db, input.id);
  if (!row) throw new Error("Habit not found");
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const next = engineCompleteHabit(habitRowToHabit(row), date);
  const streaks = computeStreaks(next.history);
  const updated = await repo.updateHabitRow(db, input.id, {
    history: next.history,
    lastCompleted: next.lastCompleted,
    currentStreak: streaks.current,
    longestStreak: Math.max(streaks.longest, row.longestStreak),
  });
  return habitRowToHabit(updated);
}

// --- reviews + links ---
export async function reviews(db: Database, goalId: string): Promise<GoalReview[]> {
  return (await repo.listReviews(db, [goalId])).map(reviewRowToReview);
}

export async function createGoalReview(
  db: Database,
  input: { goalId: string; reviewPeriod: ReviewPeriod; summary?: string | undefined },
): Promise<GoalReview> {
  const goal = await get(db, input.goalId);
  const draft = createReview(goal, input.reviewPeriod, input.summary ?? "", new Date());
  const row = await repo.insertReview(db, {
    goalId: input.goalId,
    reviewPeriod: draft.reviewPeriod,
    summary: draft.summary,
    progressSnapshot: draft.progressSnapshot,
  });
  return reviewRowToReview(row);
}

export async function addLink(
  db: Database,
  input: { goalId: string; target: GoalLinkTarget; targetId: string },
): Promise<{ ok: true }> {
  await repo.insertLink(db, {
    goalId: input.goalId,
    ...linkToColumns(input.target, input.targetId),
  });
  return { ok: true };
}
