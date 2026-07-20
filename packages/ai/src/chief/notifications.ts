/**
 * AI Notifications (Sprint 5.2). Proactive nudges, each grounded in a deterministic trigger — free
 * time from a cancelled meeting, a break due, a leave-by time for a fixed commitment, low readiness.
 * The Chief proposes; it never fires notifications on its own (the Notification engine + Platform
 * layer deliver). Suppressed entirely when the profile's notification style is "quiet".
 */
import { breakDue, minutesBetween } from "./signals";
import type { ChiefContext, ChiefNotification } from "./types";

/** Derive proactive notifications from the context. Deterministic + grounded. */
export function chiefNotifications(ctx: ChiefContext): ChiefNotification[] {
  if (ctx.profile.notificationStyle === "quiet") return [];
  const out: ChiefNotification[] = [];

  // Free time from a disruption.
  const free = ctx.disruptions.find((d) => d.kind === "free_time" || d.kind === "cancelled_event");
  if (free) {
    const top = ctx.tasks.find((t) => t.status !== "done");
    out.push({
      kind: "free_time",
      title: free.kind === "cancelled_event" ? "Meeting cancelled" : "Free time opened up",
      body: `You now have ${free.minutes ?? "some"} minutes free.${top ? ` Move "${top.title}" here?` : ""}`,
      ...(top
        ? {
            action: {
              title: `Start "${top.title}"`,
              action: "start_focus",
              ref: { module: "task", id: top.id },
            },
          }
        : {}),
    });
  }

  // Break due.
  if (breakDue(ctx) && ctx.activeFocusSession) {
    const elapsed = minutesBetween(ctx.activeFocusSession.startedAt, ctx.now);
    out.push({
      kind: "break_due",
      title: "Time for a break",
      body: `You've worked for ${elapsed} minutes. A short break will keep you sharp.`,
      action: { title: "Take a break", action: "take_break" },
    });
  }

  // Leave-by for the next fixed event (assume 20 min buffer).
  const next = [...ctx.calendarEvents]
    .filter((e) => new Date(e.start).getTime() > new Date(ctx.now).getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  if (next) {
    const mins = minutesBetween(ctx.now, next.start);
    if (mins <= 30 && mins > 0) {
      out.push({
        kind: "deadline_leave",
        title: `"${next.title}" starts soon`,
        body: `${next.title} is in ${mins} minutes — wrap up and prepare.`,
      });
    }
  }

  // Low readiness.
  if (ctx.readiness !== null && ctx.readiness < 40) {
    out.push({
      kind: "readiness",
      title: "Readiness is low",
      body: "Your recovery is low today — favour lighter work and protect your energy.",
    });
  }

  return out;
}
