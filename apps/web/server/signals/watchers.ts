import "server-only";
import type { Database } from "@myos/db";
import type { DomainEvent, OpportunityContext, RiskContext } from "@myos/core/events";
import * as taskService from "../task/service";
import * as calendarService from "../calendar/service";
import { healthSignals } from "../health";

/**
 * Event Watchers (Sprint 6.1). Each watcher OBSERVES a module's frozen read models and normalizes
 * meaningful state into the Event Intelligence Engine's inputs — a RiskContext, an OpportunityContext,
 * and any discrete DomainEvents. Watchers NEVER mutate: they only read. Reads degrade to safe empties
 * so a signal cycle always runs. No business logic lives here — plumbing only.
 */

interface WatcherInputs {
  events: DomainEvent[];
  risk: RiskContext;
  opportunity: OpportunityContext;
}

const isoDate = (now: Date) => now.toISOString().slice(0, 10);

/** Gather every watcher's observations for one cycle. */
export async function gatherWatcherInputs(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<WatcherInputs> {
  const date = isoDate(now);
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const [tasks, events, health] = await Promise.all([
    taskService.list(db, {}).catch(() => [] as unknown[]),
    calendarService.list(db, { from: dayStart, to: dayEnd }).catch(() => [] as unknown[]),
    healthSignals(db, date, now).catch(() => null),
  ]);

  const openTasks = (
    tasks as {
      id: string;
      title: string;
      status: string;
      estimatedMinutes: number | null;
      dueAt: string | null;
    }[]
  ).filter((t) => t.status !== "done" && t.status !== "cancelled");

  const meetings = (events as { id: string; title: string; startAt: string; endAt: string }[])
    .slice()
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // TaskWatcher → deadline risks: tasks due within a week whose estimate exceeds available time.
  const deadlines: RiskContext["deadlines"] = [];
  for (const t of openTasks) {
    if (!t.dueAt) continue;
    const daysRemaining = Math.floor((new Date(t.dueAt).getTime() - now.getTime()) / 86_400_000);
    if (daysRemaining < 0 || daysRemaining > 7) continue;
    const estimateHours = Math.round(((t.estimatedMinutes ?? 60) / 60) * 10) / 10;
    // Crude available-time proxy: 3 focused hours per remaining day.
    const availableHours = Math.max(0, daysRemaining) * 3 + 1;
    deadlines.push({ id: t.id, label: t.title, daysRemaining, estimateHours, availableHours });
  }

  // CalendarWatcher → meeting load + freed window (gap from now to the next meeting).
  const meetingsToday = meetings.filter(
    (m) => new Date(m.startAt).toISOString().slice(0, 10) === date,
  ).length;
  const nextMeeting = meetings.find((m) => new Date(m.startAt).getTime() > now.getTime());
  const windowEnd = nextMeeting
    ? new Date(nextMeeting.startAt).getTime()
    : now.getTime() + 120 * 60_000;
  const freedMinutes = Math.max(0, Math.round((windowEnd - now.getTime()) / 60_000));

  // HealthWatcher → readiness (drives burnout risk + deep-work opportunity).
  const readiness = health ? health.readiness : null;

  const risk: RiskContext = {
    deadlines,
    readiness,
    meetingsToday,
    daysSinceWorkout: 0, // not exposed by the current read model; 0 = no consistency signal
    exams: [],
  };

  const opportunity: OpportunityContext = {
    freedMinutes,
    earlyCompletion: null,
    readiness,
    freeEvening: false,
    resumableProject: null,
  };

  return { events: [], risk, opportunity };
}
