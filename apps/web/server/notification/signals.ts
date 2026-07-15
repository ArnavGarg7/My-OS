import "server-only";
import {
  computeSignals,
  type NotificationRuleContext,
  type NotificationSignals,
} from "@myos/core/notification";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { listActive, getPreferences } from "./repository";
import { signals as financeSignals } from "../finance/summary";
import { signals as goalSignals } from "../goal/summary";
import { signals as projectSignals } from "../project/service";
import { healthSignals } from "../health/signals";
import { counts as tomorrowCounts } from "../tomorrow/service";
import { countNew as inboxCountNew } from "../inbox/service";
import { recommendations as focusRecommendations } from "../focus/service";
import { listBlocks } from "../planner/repository";
import { list as calendarList } from "../calendar/service";

/**
 * Notification signals (Sprint 3.3). Two responsibilities:
 *  1. `notificationSignals` — decision-facing counts/booleans from current state.
 *  2. `gatherRuleContext` — assemble the deterministic NotificationRuleContext by
 *     reading each module's signals. The engine holds no feature logic; every input
 *     comes from a module here. Each read `.catch`es to degrade gracefully.
 */
export async function notificationSignals(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<NotificationSignals> {
  const [notifications, prefs] = await Promise.all([
    listActive(db).catch(() => []),
    getPreferences(db).catch(() => undefined),
  ]);
  const preferences = prefs ?? (await getPreferences(db));
  return computeSignals({ notifications, prefs: preferences, now, timezone: tz });
}

function minutesUntil(iso: Date | null | undefined, now: Date): number | null {
  if (!iso) return null;
  return Math.round((iso.getTime() - now.getTime()) / 60_000);
}

export async function gatherRuleContext(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<NotificationRuleContext> {
  const date = todayInTimeZone(tz);

  const [health, finance, goal, project, tomorrow, inbox, focus, blocks, calendar] =
    await Promise.all([
      healthSignals(db, date).catch(() => null),
      financeSignals(db, tz).catch(() => null),
      goalSignals(db).catch(() => null),
      projectSignals(db, now).catch(() => null),
      tomorrowCounts(db, tz).catch(() => null),
      inboxCountNew(db).catch(() => 0),
      focusRecommendations(db, tz).catch(() => []),
      listBlocks(db, date).catch(() => []),
      calendarList(db, {
        from: `${date}T00:00:00.000Z`,
        to: `${date}T23:59:59.999Z`,
      }).catch(() => []),
    ]);

  // Planner: soonest upcoming, not-yet-completed block starting within 10 min.
  const upcomingBlock = blocks
    .filter((b) => !b.completed && b.type !== "meeting" && b.startTime.getTime() > now.getTime())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  const blockMinutes = minutesUntil(upcomingBlock?.startTime ?? null, now);

  // Calendar: soonest upcoming meeting within 10 min.
  const upcomingMeeting = calendar
    .map((e) => ({ ...e, start: new Date(e.startAt) }))
    .filter((e) => e.start.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  const meetingMinutes = minutesUntil(upcomingMeeting?.start ?? null, now);

  const breakDue = focus.some((r) => r.action === "take_break" || r.action === "recovery_walk");

  const ctx: NotificationRuleContext = { now };

  if (upcomingBlock && blockMinutes !== null && blockMinutes <= 10) {
    ctx.planner = {
      blockStartingTitle: upcomingBlock.title,
      blockStartingInMinutes: blockMinutes,
      blockStartingHref: "/planner",
    };
  }
  if (upcomingMeeting && meetingMinutes !== null && meetingMinutes <= 10) {
    ctx.calendar = {
      meetingTitle: upcomingMeeting.title,
      meetingInMinutes: meetingMinutes,
      meetingHref: "/calendar",
    };
  }
  if (breakDue) ctx.focus = { breakDue: true };
  if (health) {
    ctx.health = {
      waterOverdue: health.hydrationPercent < 50,
      recoveryNeeded: health.readiness < 55,
    };
  }
  if (finance) {
    ctx.finance = {
      budgetExceededCategory: finance.overBudgetCategories[0] ?? null,
      billDueName: finance.largePaymentDueToday?.name ?? null,
    };
  }
  if (goal) {
    ctx.goals = {
      reviewDue: goal.quarterEnding,
      goalBehindTitle: goal.behindGoals[0]?.title ?? null,
      habitReminderTitle: goal.habitsAtRisk[0]?.title ?? null,
    };
  }
  if (project) {
    ctx.projects = { milestoneDueTitle: project.criticalMilestones[0]?.title ?? null };
  }
  if (tomorrow) {
    ctx.tomorrow = {
      notPlanned: !tomorrow.ready && tomorrow.priorityCount === 0,
      checklistIncomplete: tomorrow.checklistPercent < 100 && tomorrow.priorityCount > 0,
    };
  }
  ctx.inbox = { unreadCount: inbox };

  return ctx;
}
