import "server-only";
import { assembleMorningBriefing } from "@myos/core/morning";
import { calculateFocusScore, selectWorkingHours, todayInTimeZone } from "@myos/core/today";
import type {
  AddNoteInput,
  DailyFocus,
  DailyMetrics,
  DailyNote,
  DailyState,
  Decision,
  DecisionHistoryInput,
  UpdateFocusInput,
  UpdateMetricsInput,
  UpdateStateInput,
} from "@myos/core/today";
import type { Database } from "@myos/db";
import type {
  DailyFocusRow,
  DailyMetricsRow,
  DailyNoteRow,
  DailyStateRow,
  DecisionHistoryRow,
} from "@myos/db/schema";
import * as repo from "./repository";

/**
 * TodayService (Sprint 2.1). Orchestrates persistence + the deterministic core
 * planner and maps DB rows to domain DTOs. Auth is enforced by the tRPC layer;
 * "today" is resolved from the caller's timezone.
 */
function resolveDate(timezone: string, date?: string): string {
  return date ?? todayInTimeZone(timezone);
}

function toState(row: DailyStateRow): DailyState {
  return {
    date: row.date,
    wakeTime: row.wakeTime,
    sleepTarget: row.sleepTarget,
    energyLevel: row.energyLevel,
    focusScore: row.focusScore,
    currentBlock: row.currentBlock,
    currentActivity: row.currentActivity,
    status: row.status,
    morningCompleted: row.morningCompleted,
    eveningCompleted: row.eveningCompleted,
    lastRecalculatedAt: row.lastRecalculatedAt ? row.lastRecalculatedAt.toISOString() : null,
  };
}

function toFocus(row: DailyFocusRow): DailyFocus {
  return {
    date: row.date,
    mission: row.mission,
    blocker: row.blocker,
    priority: row.priority,
    deepWork: row.deepWork,
    quickWin: row.quickWin,
  };
}

function toMetrics(row: DailyMetricsRow): DailyMetrics {
  return {
    date: row.date,
    completedTasks: row.completedTasks,
    deepWorkMinutes: row.deepWorkMinutes,
    meetings: row.meetings,
    interruptions: row.interruptions,
    focusSwitches: row.focusSwitches,
    plannerAccuracy: row.plannerAccuracy,
    energyEntries: row.energyEntries,
  };
}

function toNote(row: DailyNoteRow): DailyNote {
  return {
    id: row.id,
    date: row.date,
    timestamp: row.timestamp.toISOString(),
    content: row.content,
    type: row.type,
  };
}

function toDecision(row: DecisionHistoryRow): Decision {
  return {
    id: row.id,
    date: row.date,
    decision: row.decision,
    reason: row.reason,
    confidence: row.confidence,
    accepted: row.accepted,
    dismissed: row.dismissed,
    timestamp: row.timestamp.toISOString(),
  };
}

const emptyState = (date: string): DailyState => ({
  date,
  wakeTime: null,
  sleepTarget: null,
  energyLevel: null,
  focusScore: null,
  currentBlock: null,
  currentActivity: null,
  status: "idle",
  morningCompleted: false,
  eveningCompleted: false,
  lastRecalculatedAt: null,
});

const emptyFocus = (date: string): DailyFocus => ({
  date,
  mission: null,
  blocker: null,
  priority: null,
  deepWork: null,
  quickWin: null,
});

const emptyMetrics = (date: string): DailyMetrics => ({
  date,
  completedTasks: 0,
  deepWorkMinutes: 0,
  meetings: 0,
  interruptions: 0,
  focusSwitches: 0,
  plannerAccuracy: null,
  energyEntries: [],
});

export async function getState(db: Database, tz: string, date?: string): Promise<DailyState> {
  const day = resolveDate(tz, date);
  const row = await repo.getState(db, day);
  return row ? toState(row) : emptyState(day);
}

export async function updateState(
  db: Database,
  tz: string,
  input: UpdateStateInput,
): Promise<DailyState> {
  const { date, ...patch } = input;
  const day = resolveDate(tz, date);
  const row = await repo.upsertState(db, day, patch);
  return toState(row);
}

export async function getFocus(db: Database, tz: string, date?: string): Promise<DailyFocus> {
  const day = resolveDate(tz, date);
  const row = await repo.getFocus(db, day);
  return row ? toFocus(row) : emptyFocus(day);
}

export async function updateFocus(
  db: Database,
  tz: string,
  input: UpdateFocusInput,
): Promise<DailyFocus> {
  const { date, ...patch } = input;
  const day = resolveDate(tz, date);
  await repo.ensureDay(db, day);
  const row = await repo.upsertFocus(db, day, patch);
  return toFocus(row);
}

export async function getMetrics(db: Database, tz: string, date?: string): Promise<DailyMetrics> {
  const day = resolveDate(tz, date);
  const row = await repo.getMetrics(db, day);
  return row ? toMetrics(row) : emptyMetrics(day);
}

export async function updateMetrics(
  db: Database,
  tz: string,
  input: UpdateMetricsInput,
): Promise<DailyMetrics> {
  const { date, ...patch } = input;
  const day = resolveDate(tz, date);
  await repo.ensureDay(db, day);
  const row = await repo.upsertMetrics(db, day, patch);
  // Deterministically recompute the day's focus score from the metrics.
  const focusScore = calculateFocusScore(row);
  await repo.upsertState(db, day, { focusScore, lastRecalculatedAt: new Date() });
  return toMetrics(row);
}

export async function addNote(db: Database, tz: string, input: AddNoteInput): Promise<DailyNote> {
  const day = resolveDate(tz, input.date);
  await repo.ensureDay(db, day);
  const row = await repo.addNote(db, { date: day, content: input.content, type: input.type });
  return toNote(row);
}

export async function listNotes(db: Database, tz: string, date?: string): Promise<DailyNote[]> {
  const day = resolveDate(tz, date);
  const rows = await repo.listNotes(db, day);
  return rows.map(toNote);
}

export async function getDecisionHistory(
  db: Database,
  tz: string,
  input: DecisionHistoryInput,
): Promise<Decision[]> {
  const rows = await repo.listDecisions(db, input.date, input.limit ?? 50);
  return rows.map(toDecision);
}

/** Mark the morning briefing as completed for the day (with a timestamp). */
export async function completeMorning(
  db: Database,
  tz: string,
  date?: string,
): Promise<DailyState> {
  const day = resolveDate(tz, date);
  const row = await repo.upsertState(db, day, {
    morningCompleted: true,
    morningCompletedAt: new Date(),
  });
  return toState(row);
}

export interface BriefingPrefs {
  displayName: string | null;
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

/**
 * Assemble today's briefing server-side and log its recommendation into
 * `decision_history` (deduped by day + decision text). Prepares Sprint 2.3.
 */
export async function logRecommendation(
  db: Database,
  tz: string,
  prefs: BriefingPrefs,
): Promise<{ decision: string; logged: boolean }> {
  const day = resolveDate(tz);
  await repo.ensureDay(db, day);

  const [stateRow, focusRow, metricsRow, pendingDecisions, pendingNotes] = await Promise.all([
    repo.getState(db, day),
    repo.getFocus(db, day),
    repo.getMetrics(db, day),
    repo.countPendingDecisions(db, day),
    repo.countNotes(db, day),
  ]);

  const state = stateRow ? toState(stateRow) : null;
  const workingHours = selectWorkingHours({
    state,
    preferredStartOfDay: prefs.preferredStartOfDay,
    preferredEndOfDay: prefs.preferredEndOfDay,
  });

  const briefing = assembleMorningBriefing({
    now: new Date(),
    timezone: tz,
    name: prefs.displayName,
    state,
    focus: focusRow ? toFocus(focusRow) : null,
    metrics: metricsRow ? toMetrics(metricsRow) : null,
    workingHours,
    counts: { unreadInbox: 0, pendingDecisions, pendingNotes },
    yesterday: null,
  });

  const rec = briefing.recommendation;
  const existing = await repo.findDecisionByText(db, day, rec.decision);
  if (existing) return { decision: rec.decision, logged: false };

  await repo.addDecision(db, {
    date: day,
    decision: rec.decision,
    reason: rec.reason,
    confidence: rec.confidence,
  });
  return { decision: rec.decision, logged: true };
}
