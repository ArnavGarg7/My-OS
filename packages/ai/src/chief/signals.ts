/**
 * Chief signals (Sprint 5.2). Pure derivations over `ChiefContext` that the recommendation,
 * morning and notification engines share: the best focus window, the biggest risk, the top
 * opportunity, whether a break is due, and time-based helpers. Everything is grounded in the
 * deterministic read models — no invention.
 */
import type { ChiefContext, FocusWindow } from "./types";

/** Milliseconds between two ISO timestamps. */
export function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

/** The longest uninterrupted focus window (or the longest window if none uninterrupted). */
export function bestFocusWindow(ctx: ChiefContext): FocusWindow | null {
  const windows = [...ctx.focusWindows].sort((a, b) => {
    if (a.uninterrupted !== b.uninterrupted) return a.uninterrupted ? -1 : 1;
    return b.minutes - a.minutes;
  });
  return windows[0] ?? null;
}

/** The single biggest risk to the day, grounded in the plan/calendar (or null if none). */
export function biggestRisk(ctx: ChiefContext): string | null {
  const uninterrupted = ctx.focusWindows.filter((w) => w.uninterrupted && w.minutes >= 60);
  if (ctx.disruptions.length > 0) {
    const d = ctx.disruptions[0]!;
    return `Your plan was disrupted: ${d.detail}.`;
  }
  if (uninterrupted.length === 1) {
    return "Only one uninterrupted focus block exists today — protect it.";
  }
  if (uninterrupted.length === 0 && ctx.tasks.some((t) => (t.estimateMin ?? 0) >= 60)) {
    return "No uninterrupted focus block today, but deep work is queued.";
  }
  const overdue = ctx.tasks.filter(
    (t) => t.dueAt && new Date(t.dueAt).getTime() < new Date(ctx.now).getTime(),
  );
  if (overdue.length > 0) return `${overdue.length} task(s) are overdue.`;
  return null;
}

/** The top opportunity — usually newly-free time or an ideal window for the top task. */
export function topOpportunity(ctx: ChiefContext): string | null {
  const free = ctx.disruptions.find((d) => d.kind === "free_time");
  if (free) return `You have ${free.minutes ?? "some"} free minutes — use them for focused work.`;
  const window = bestFocusWindow(ctx);
  const top = ctx.tasks[0];
  if (window?.uninterrupted && top) {
    return `${window.minutes} uninterrupted minutes — ideal for "${top.title}".`;
  }
  return null;
}

/** Is a break due? True when an active focus session has run past the profile break cadence. */
export function breakDue(ctx: ChiefContext): boolean {
  if (!ctx.activeFocusSession) return false;
  const elapsed = minutesBetween(ctx.activeFocusSession.startedAt, ctx.now);
  return elapsed >= ctx.profile.breakFrequencyMinutes;
}

/** Whether the user currently has no active work and free time — the "idle" trigger. */
export function isIdle(ctx: ChiefContext): boolean {
  return !ctx.activeFocusSession && ctx.focusWindows.some((w) => w.minutes >= 15);
}
