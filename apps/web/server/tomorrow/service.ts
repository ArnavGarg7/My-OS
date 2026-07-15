import "server-only";
import {
  DEFAULT_CHECKLIST,
  tomorrowEngine,
  type CalendarMergeEvent,
  type CarryForwardCandidate,
  type PriorityCandidate,
  type StudioStep,
  type TomorrowContext,
  type TomorrowStatus,
} from "@myos/core/tomorrow";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { list as taskList } from "../task/service";
import { list as calendarList } from "../calendar/service";
import { list as inboxList } from "../inbox/service";
import { list as decisionList } from "../decision/service";
import { signals as projectSignals } from "../project/service";
import { healthSignals } from "../health/signals";
import { getMetrics } from "../today/service";
import { portfolio as goalPortfolio } from "../goal/summary";
import { signals as journalSignals } from "../journal/summary";
import * as repo from "./repository";
import { planRowToPlan, priorityRowToDTO } from "./mapper";

/**
 * TomorrowService (Sprint 3.1). Assembles the deterministic `TomorrowContext`
 * from the existing engines (Today/Task/Planner/Calendar/Decision/Goal/Health/
 * Journal) and runs the pure TomorrowEngine. It orchestrates — it owns no work,
 * carries nothing forward automatically and never edits the calendar.
 */
const DAY_MS = 86_400_000;
const PRIO_NUM: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 };
const PRIO_LABEL: Record<string, "low" | "medium" | "high"> = {
  urgent: "high",
  high: "high",
  medium: "medium",
  low: "low",
};

function addDay(date: string, n: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export async function buildContext(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<TomorrowContext> {
  const planningDate = todayInTimeZone(tz);
  const targetDate = addDay(planningDate, 1);
  const nowISO = now.toISOString();

  const [tasks, calendar, inbox, decisions, project, health, metrics, goals, journal] =
    await Promise.all([
      taskList(db, {}).catch(() => []),
      calendarList(db, {
        from: `${targetDate}T00:00:00.000Z`,
        to: `${targetDate}T23:59:59.999Z`,
      }).catch(() => []),
      inboxList(db, { status: "new" }).catch(() => []),
      decisionList(db, undefined, 30).catch(() => []),
      projectSignals(db, now).catch(() => null),
      healthSignals(db, planningDate).catch(() => null),
      getMetrics(db, tz).catch(() => null),
      goalPortfolio(db).catch(() => null),
      journalSignals(db, tz).catch(() => null),
    ]);

  const open = tasks.filter((t) => t.completedAt === null);
  const overdue = open.filter((t) => t.dueAt !== null && t.dueAt < nowISO);
  const createdToday = tasks.filter((t) => t.createdAt.slice(0, 10) === planningDate).length;
  const decisionsAccepted = decisions.filter(
    (d) => d.state === "accepted" || d.state === "completed",
  ).length;

  // --- review ---
  const review = {
    tasksCompleted: metrics?.completedTasks ?? 0,
    tasksCreated: createdToday,
    plannerAccuracy: metrics?.plannerAccuracy ?? 0,
    decisionsAccepted,
    deepWorkMinutes: metrics?.deepWorkMinutes ?? 0,
    calendarCompletion: 100,
    goalProgress: goals?.overallProgress ?? 0,
    healthReadiness: health?.readiness ?? 0,
    journalCompleted: journal?.loggedToday ?? false,
  };

  // --- carry forward (nothing moves without confirmation) ---
  const carryForwardCandidates: CarryForwardCandidate[] = [
    ...overdue.map((t) => ({
      id: `task:${t.id}`,
      kind: "task" as const,
      title: t.title,
      reason: "Overdue",
      entityId: t.id,
      dueDate: t.dueAt,
      priority: PRIO_LABEL[t.priority] ?? "medium",
    })),
    ...(project?.criticalMilestones ?? []).map((m, i) => ({
      id: `milestone:${i}`,
      kind: "milestone" as const,
      title: m.title,
      reason: `${m.projectName} · due in ${m.dueInDays}d`,
      entityId: `${m.projectName}:${m.title}`,
    })),
    ...decisions
      .filter((d) => d.state === "pending")
      .map((d) => ({
        id: `decision:${d.id}`,
        kind: "decision" as const,
        title: d.title,
        reason: "Active decision",
        entityId: d.id,
      })),
    ...inbox.map((it) => ({
      id: `inbox:${it.id}`,
      kind: "inbox" as const,
      title: it.title || it.content || "Inbox item",
      reason: "Unprocessed",
      entityId: it.id,
    })),
  ];

  // --- priorities ---
  const priorityCandidates: PriorityCandidate[] = open
    .slice()
    .sort((a, b) => (PRIO_NUM[b.priority] ?? 0) - (PRIO_NUM[a.priority] ?? 0))
    .slice(0, 12)
    .map((t) => ({
      id: `task:${t.id}`,
      kind: "task" as const,
      title: t.title,
      entityId: t.id,
      taskPriority: PRIO_NUM[t.priority] ?? 0,
      projectUrgency: t.projectId ? 2 : 0,
      goalDeadline: t.objectiveId ? 1 : 0,
      plannerOverflow: t.dueAt && t.dueAt < nowISO ? 1 : 0,
    }));

  // --- calendar (read-only mirror) ---
  const cal: CalendarMergeEvent[] = calendar.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startAt,
    end: e.endAt,
    kind: e.allDay ? "event" : "meeting",
  }));
  const meetingMinutes = cal
    .filter((e) => e.kind === "meeting")
    .reduce(
      (acc, e) =>
        acc + Math.max(0, (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000),
      0,
    );

  const expectedWorkloadMinutes = priorityCandidates
    .slice(0, 5)
    .reduce((acc, p) => acc + (open.find((t) => t.id === p.entityId)?.estimatedMinutes ?? 45), 0);

  return {
    now,
    timezone: tz,
    planningDate,
    targetDate,
    review,
    carryForwardCandidates,
    priorityCandidates,
    calendar: cal,
    readiness: {
      expectedWorkloadMinutes,
      meetingMinutes: Math.round(meetingMinutes),
      healthReadiness: health?.readiness ?? 0,
    },
  };
}

/** Ensure a plan row exists for today and seed the checklist. */
export async function ensurePlan(db: Database, tz: string) {
  const planningDate = todayInTimeZone(tz);
  const targetDate = addDay(planningDate, 1);
  const row = await repo.upsertPlan(db, { planningDate, targetDate });
  await repo.seedChecklist(db, row.id, DEFAULT_CHECKLIST);
  return planRowToPlan(row);
}

async function loadState(db: Database, tz: string, step: StudioStep = "review") {
  const ctx = await buildContext(db, tz);
  const plan = await ensurePlan(db, tz);
  const checklistRows = await repo.listChecklist(db, plan.id);
  const checklist = checklistRows.map((r) => ({
    id: r.id,
    item: r.item,
    completed: r.completed,
    required: r.required,
  }));
  const state = tomorrowEngine.run({ ...ctx, checklist }, step);
  return { ctx, plan, state };
}

export async function get(db: Database, tz: string) {
  const { plan, state } = await loadState(db, tz);
  const priorities = (await repo.listPriorities(db, plan.id)).map(priorityRowToDTO);
  return { plan, state, savedPriorities: priorities };
}

export async function review(db: Database, tz: string) {
  return tomorrowEngine.run(await buildContext(db, tz), "review").review;
}

export async function carryForward(db: Database, tz: string) {
  return tomorrowEngine.run(await buildContext(db, tz), "carry_forward").carryForward;
}

export async function priorities(db: Database, tz: string) {
  return tomorrowEngine.run(await buildContext(db, tz), "priorities").priorities;
}

export async function readiness(db: Database, tz: string) {
  return tomorrowEngine.run(await buildContext(db, tz), "readiness").readiness;
}

export async function savePriorities(
  db: Database,
  tz: string,
  chosen: {
    title: string;
    taskId?: string | null | undefined;
    projectId?: string | null | undefined;
    goalId?: string | null | undefined;
  }[],
) {
  const plan = await ensurePlan(db, tz);
  const rows = await repo.replacePriorities(
    db,
    plan.id,
    chosen.map((c, i) => ({
      priorityOrder: i,
      title: c.title,
      taskId: c.taskId ?? null,
      projectId: c.projectId ?? null,
      goalId: c.goalId ?? null,
    })),
  );
  return rows.map(priorityRowToDTO);
}

export async function checklist(db: Database, tz: string) {
  const plan = await ensurePlan(db, tz);
  const rows = await repo.listChecklist(db, plan.id);
  const items = rows.map((r) => ({
    id: r.id,
    item: r.item,
    completed: r.completed,
    required: r.required,
  }));
  return tomorrowEngine.run({ ...(await buildContext(db, tz)), checklist: items }, "checklist")
    .checklist;
}

export async function toggleChecklist(
  db: Database,
  tz: string,
  itemId: string,
  completed: boolean,
) {
  await repo.setChecklistItem(db, itemId, completed);
  return checklist(db, tz);
}

async function setStatus(db: Database, tz: string, status: TomorrowStatus, completed: boolean) {
  const plan = await ensurePlan(db, tz);
  const row = await repo.setPlanStatus(db, plan.id, status, completed);
  return planRowToPlan(row);
}

export async function finalize(db: Database, tz: string) {
  return setStatus(db, tz, "planned", true);
}
export async function lock(db: Database, tz: string) {
  return setStatus(db, tz, "locked", true);
}
export async function reopen(db: Database, tz: string) {
  return setStatus(db, tz, "draft", false);
}

export async function summary(db: Database, tz: string) {
  const { plan, state } = await loadState(db, tz);
  return tomorrowEngine.summarize(
    state,
    plan.status,
    state.review.completionScore >= 0 ? "review" : "review",
    0,
  );
}

export async function counts(db: Database, tz: string) {
  const { plan, state } = await loadState(db, tz);
  return {
    status: plan.status,
    priorityCount: state.priorities.top.length,
    carryForwardCount: state.carryForward.total,
    checklistPercent: state.checklist.percent,
    readinessScore: state.readiness.score,
    ready: state.ready,
  };
}

/** Deterministic signals for the Decision engine (Sprint 3.1). */
export async function signals(db: Database, tz: string) {
  return tomorrowEngine.signals(await buildContext(db, tz));
}
