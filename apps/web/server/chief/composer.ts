import "server-only";
import type { Database } from "@myos/db";
import type { ChiefContext, PersonalProfile, ScoredTask } from "@myos/ai/chief";
import { defaultProfile } from "@myos/ai/chief";
import * as taskService from "../task/service";
import * as calendarService from "../calendar/service";
import * as goalService from "../goal/service";
import * as decisionService from "../decision/service";
import { healthSignals } from "../health";
import { focusSignals } from "../focus";
import { signalDisruptions } from "../signals/service";
import { loadProfile } from "./repository";

/**
 * Chief composer (Sprint 5.2). The ONE place the Chief meets the rest of My OS. Every field of the
 * `ChiefContext` is READ from the module that owns it — tasks from the Task service, meetings from
 * Calendar, readiness/energy from Health, the active session from Focus, pending decisions from the
 * Decision engine, the profile from its own table. Nothing is recomputed here: this is plumbing,
 * not business logic. Read failures degrade to safe defaults so the Chief always answers.
 */

function isoDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Map the Health EnergyLevel enum onto the Chief's coarse low/medium/high. */
function mapEnergy(level: string | null): "low" | "medium" | "high" | null {
  if (!level) return null;
  const l = level.toLowerCase();
  if (l.includes("low")) return "low";
  if (l.includes("high") || l.includes("good") || l.includes("excellent")) return "high";
  return "medium";
}

/** Deterministically score + shape tasks for the Chief (due-soonest first). */
function scoreTasks(
  tasks: {
    id: string;
    title: string;
    status: string;
    estimatedMinutes: number | null;
    dueAt: string | null;
  }[],
): ScoredTask[] {
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const sorted = [...open].sort((a, b) => {
    const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return ad - bd;
  });
  return sorted.slice(0, 20).map((t, i) => ({
    id: t.id,
    title: t.title,
    score: Math.max(1, 100 - i * 5),
    dueAt: t.dueAt,
    estimateMin: t.estimatedMinutes,
    status: t.status,
  }));
}

export async function composeChiefContext(
  db: Database,
  tz: string,
  greetingName: string,
  now = new Date(),
): Promise<ChiefContext> {
  const date = isoDate(now);
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const [tasks, events, goals, health, focus, decisions, profile, disruptions] = await Promise.all([
    taskService.list(db, {}).catch(() => []),
    calendarService.list(db, { from: dayStart, to: dayEnd }).catch(() => []),
    goalService.list(db).catch(() => []),
    healthSignals(db, date, now).catch(() => null),
    focusSignals(db, tz, now).catch(() => null),
    decisionService.list(db, undefined, 50).catch(() => [] as unknown[]),
    loadProfile(db).catch(() => null),
    // Sprint 6.1: the Chief's situational awareness now comes from the Event Intelligence Engine.
    signalDisruptions(db, tz, now).catch(() => []),
  ]);

  const scored = scoreTasks(tasks as never[]);
  const calendarEvents = (events as { id: string; title: string; startAt: string; endAt: string }[])
    .map((e) => ({ id: e.id, title: e.title, start: e.startAt, end: e.endAt }))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Derive a focus window: the gap between now and the next event start (or 120 min if free).
  const upcoming = calendarEvents.find((e) => new Date(e.start).getTime() > now.getTime());
  const windowEnd = upcoming ? upcoming.start : new Date(now.getTime() + 120 * 60000).toISOString();
  const windowMinutes = Math.max(
    0,
    Math.round((new Date(windowEnd).getTime() - now.getTime()) / 60000),
  );
  const focusWindows =
    windowMinutes >= 15
      ? [{ start: now.toISOString(), end: windowEnd, minutes: windowMinutes, uninterrupted: true }]
      : [];

  // FocusSignals exposes `active` as a boolean + minutes focused today. Approximate the session
  // start from focusMinutesToday so break/continue logic is grounded (no session object is exposed).
  const activeSession = focus?.active
    ? {
        startedAt: new Date(
          now.getTime() - Math.max(0, focus.focusMinutesToday) * 60000,
        ).toISOString(),
        plannedMinutes: 50,
      }
    : null;

  const resolvedProfile: PersonalProfile = profile ?? defaultProfile();

  return {
    now: now.toISOString(),
    timezone: tz,
    greetingName,
    readiness: health ? health.readiness : null,
    energy: mapEnergy(health ? health.energy : null),
    mission: {
      title: "Today's mission",
      priorities: scored
        .slice(0, 3)
        .map((t, i) => ({ rank: i + 1, label: t.title, ref: { module: "task", id: t.id } })),
    },
    focusWindows,
    planBlocks: [],
    calendarEvents,
    tasks: scored,
    goals: (goals as { id: string; title: string; progress?: number }[])
      .slice(0, 10)
      .map((g) => ({ id: g.id, title: g.title, progress: g.progress ?? 0, staleDays: 0 })),
    activeFocusSession: activeSession,
    pendingDecisions: Array.isArray(decisions) ? decisions.length : 0,
    disruptions,
    profile: resolvedProfile,
  };
}
