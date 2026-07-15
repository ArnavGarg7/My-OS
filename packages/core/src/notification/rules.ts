import { DEFAULT_TTL_MINUTES } from "./constants";
import { buildDedupeKey } from "./deduplication";
import type { NotificationDraft } from "./types";

/**
 * Notification rules (Sprint 3.3). Deterministic mappings from module SIGNALS to
 * notification drafts. The engine holds NO feature logic — each module supplies a
 * signal block, and a rule decides whether a notification should exist. No AI, no
 * randomness. New modules append their own rules + signal block.
 */
export interface NotificationRuleContext {
  now: Date;
  planner?: {
    blockStartingTitle?: string | null;
    blockStartingInMinutes?: number | null;
    blockStartingHref?: string | null;
    dayComplete?: boolean;
  };
  calendar?: {
    meetingTitle?: string | null;
    meetingInMinutes?: number | null;
    meetingHref?: string | null;
  };
  focus?: {
    breakDue?: boolean;
    resumeDue?: boolean;
    sessionCompleted?: boolean;
  };
  health?: {
    waterOverdue?: boolean;
    recoveryNeeded?: boolean;
    sleepReminder?: boolean;
  };
  finance?: {
    budgetExceededCategory?: string | null;
    billDueName?: string | null;
    subscriptionRenewingName?: string | null;
  };
  goals?: {
    reviewDue?: boolean;
    goalBehindTitle?: string | null;
    habitReminderTitle?: string | null;
  };
  projects?: {
    milestoneDueTitle?: string | null;
  };
  tomorrow?: {
    notPlanned?: boolean;
    checklistIncomplete?: boolean;
    eveningReviewDue?: boolean;
  };
  inbox?: {
    unreadCount?: number;
  };
}

export interface NotificationRule {
  id: string;
  matches: (ctx: NotificationRuleContext) => boolean;
  build: (ctx: NotificationRuleContext) => NotificationDraft;
}

function draft(
  partial: Omit<NotificationDraft, "dedupeKey"> & { condition: string },
): NotificationDraft {
  return {
    ...partial,
    ttlMinutes: partial.ttlMinutes ?? DEFAULT_TTL_MINUTES,
    dedupeKey: buildDedupeKey(partial.source, partial.condition),
  };
}

const UNREAD_INBOX_THRESHOLD = 20;

export const NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: "planner-block-starting",
    matches: (c) =>
      Boolean(c.planner?.blockStartingTitle) &&
      (c.planner?.blockStartingInMinutes ?? Infinity) <= 10,
    build: (c) =>
      draft({
        type: "planner",
        priority: "medium",
        title: `Starting soon: ${c.planner!.blockStartingTitle}`,
        reason: `Your planner block begins in ${c.planner!.blockStartingInMinutes} min.`,
        source: "planner",
        trigger: "planner.block_starting",
        condition: "block-starting",
        payload: { minutes: c.planner!.blockStartingInMinutes },
        sourceHref: c.planner!.blockStartingHref ?? "/planner",
      }),
  },
  {
    id: "planner-day-complete",
    matches: (c) => c.planner?.dayComplete === true,
    build: () =>
      draft({
        type: "planner",
        priority: "low",
        title: "Your plan is complete",
        reason: "Every planner block for today is done — nice work.",
        source: "planner",
        trigger: "planner.day_complete",
        condition: "day-complete",
        payload: {},
        sourceHref: "/planner",
      }),
  },
  {
    id: "calendar-meeting-soon",
    matches: (c) =>
      Boolean(c.calendar?.meetingTitle) && (c.calendar?.meetingInMinutes ?? Infinity) <= 10,
    build: (c) =>
      draft({
        type: "calendar",
        priority: "high",
        title: `Meeting in ${c.calendar!.meetingInMinutes} min`,
        reason: `${c.calendar!.meetingTitle} is starting soon.`,
        source: "calendar",
        trigger: "calendar.meeting_soon",
        condition: "meeting-soon",
        payload: { minutes: c.calendar!.meetingInMinutes },
        sourceHref: c.calendar!.meetingHref ?? "/calendar",
      }),
  },
  {
    id: "focus-break-due",
    matches: (c) => c.focus?.breakDue === true,
    build: () =>
      draft({
        type: "focus",
        priority: "medium",
        title: "Time for a break",
        reason: "You've been focused for a while — a short break keeps you sharp.",
        source: "focus",
        trigger: "focus.break_due",
        condition: "break-due",
        payload: {},
        sourceHref: "/focus",
      }),
  },
  {
    id: "focus-resume-due",
    matches: (c) => c.focus?.resumeDue === true,
    build: () =>
      draft({
        type: "focus",
        priority: "medium",
        title: "Ready to resume?",
        reason: "Your break is over — jump back into deep work.",
        source: "focus",
        trigger: "focus.resume_due",
        condition: "resume-due",
        payload: {},
        sourceHref: "/focus",
      }),
  },
  {
    id: "focus-session-completed",
    matches: (c) => c.focus?.sessionCompleted === true,
    build: () =>
      draft({
        type: "success",
        priority: "low",
        title: "Focus session complete",
        reason: "You finished a focus session — logged to your history.",
        source: "focus",
        trigger: "focus.session_completed",
        condition: "session-completed",
        payload: {},
        sourceHref: "/focus",
      }),
  },
  {
    id: "health-water-overdue",
    matches: (c) => c.health?.waterOverdue === true,
    build: () =>
      draft({
        type: "health",
        priority: "low",
        title: "Time to hydrate",
        reason: "Your water intake is behind target for today.",
        source: "health",
        trigger: "health.water_overdue",
        condition: "water-overdue",
        payload: {},
        sourceHref: "/health",
      }),
  },
  {
    id: "health-recovery-needed",
    matches: (c) => c.health?.recoveryNeeded === true,
    build: () =>
      draft({
        type: "health",
        priority: "medium",
        title: "Prioritise recovery",
        reason: "Your readiness is low — take it easier today.",
        source: "health",
        trigger: "health.recovery_needed",
        condition: "recovery-needed",
        payload: {},
        sourceHref: "/health",
      }),
  },
  {
    id: "health-sleep-reminder",
    matches: (c) => c.health?.sleepReminder === true,
    build: () =>
      draft({
        type: "health",
        priority: "low",
        title: "Wind down for sleep",
        reason: "You're approaching your sleep window.",
        source: "health",
        trigger: "health.sleep_reminder",
        condition: "sleep-reminder",
        payload: {},
        sourceHref: "/health",
      }),
  },
  {
    id: "finance-budget-exceeded",
    matches: (c) => Boolean(c.finance?.budgetExceededCategory),
    build: (c) =>
      draft({
        type: "warning",
        priority: "high",
        title: "Budget exceeded",
        reason: `You're over budget in ${c.finance!.budgetExceededCategory}.`,
        source: "finance",
        trigger: "finance.budget_exceeded",
        condition: `budget-${c.finance!.budgetExceededCategory}`,
        payload: { category: c.finance!.budgetExceededCategory },
        sourceHref: "/finance",
      }),
  },
  {
    id: "finance-bill-due",
    matches: (c) => Boolean(c.finance?.billDueName),
    build: (c) =>
      draft({
        type: "finance",
        priority: "high",
        title: `Payment due: ${c.finance!.billDueName}`,
        reason: `${c.finance!.billDueName} is due today.`,
        source: "finance",
        trigger: "finance.bill_due",
        condition: `bill-${c.finance!.billDueName}`,
        payload: { name: c.finance!.billDueName },
        sourceHref: "/finance",
      }),
  },
  {
    id: "finance-subscription-renewing",
    matches: (c) => Boolean(c.finance?.subscriptionRenewingName),
    build: (c) =>
      draft({
        type: "finance",
        priority: "medium",
        title: `Renewing: ${c.finance!.subscriptionRenewingName}`,
        reason: `${c.finance!.subscriptionRenewingName} renews soon.`,
        source: "finance",
        trigger: "finance.subscription_renewing",
        condition: `sub-${c.finance!.subscriptionRenewingName}`,
        payload: { name: c.finance!.subscriptionRenewingName },
        sourceHref: "/finance",
      }),
  },
  {
    id: "goals-review-due",
    matches: (c) => c.goals?.reviewDue === true,
    build: () =>
      draft({
        type: "goals",
        priority: "medium",
        title: "Goal review due",
        reason: "It's time to review your goals for the quarter.",
        source: "goal",
        trigger: "goal.review_due",
        condition: "review-due",
        payload: {},
        sourceHref: "/goals",
      }),
  },
  {
    id: "goals-behind",
    matches: (c) => Boolean(c.goals?.goalBehindTitle),
    build: (c) =>
      draft({
        type: "goals",
        priority: "medium",
        title: `Goal behind: ${c.goals!.goalBehindTitle}`,
        reason: `"${c.goals!.goalBehindTitle}" is behind schedule.`,
        source: "goal",
        trigger: "goal.behind",
        condition: `behind-${c.goals!.goalBehindTitle}`,
        payload: { title: c.goals!.goalBehindTitle },
        sourceHref: "/goals",
      }),
  },
  {
    id: "goals-habit-reminder",
    matches: (c) => Boolean(c.goals?.habitReminderTitle),
    build: (c) =>
      draft({
        type: "goals",
        priority: "low",
        title: `Habit: ${c.goals!.habitReminderTitle}`,
        reason: `Keep your streak — ${c.goals!.habitReminderTitle} today.`,
        source: "goal",
        trigger: "goal.habit_reminder",
        condition: `habit-${c.goals!.habitReminderTitle}`,
        payload: { title: c.goals!.habitReminderTitle },
        sourceHref: "/goals",
      }),
  },
  {
    id: "projects-milestone-due",
    matches: (c) => Boolean(c.projects?.milestoneDueTitle),
    build: (c) =>
      draft({
        type: "projects",
        priority: "medium",
        title: `Milestone due: ${c.projects!.milestoneDueTitle}`,
        reason: `"${c.projects!.milestoneDueTitle}" is due soon.`,
        source: "project",
        trigger: "project.milestone_due",
        condition: `milestone-${c.projects!.milestoneDueTitle}`,
        payload: { title: c.projects!.milestoneDueTitle },
        sourceHref: "/projects",
      }),
  },
  {
    id: "tomorrow-not-planned",
    matches: (c) => c.tomorrow?.notPlanned === true,
    build: () =>
      draft({
        type: "reminder",
        priority: "medium",
        title: "Plan tomorrow",
        reason: "Tomorrow isn't planned yet — open Tomorrow Studio to get ready.",
        source: "tomorrow",
        trigger: "tomorrow.not_planned",
        condition: "not-planned",
        payload: {},
        sourceHref: "/tomorrow",
      }),
  },
  {
    id: "tomorrow-checklist-incomplete",
    matches: (c) => c.tomorrow?.checklistIncomplete === true,
    build: () =>
      draft({
        type: "reminder",
        priority: "low",
        title: "Finish your evening checklist",
        reason: "A few checklist items remain for tomorrow.",
        source: "tomorrow",
        trigger: "tomorrow.checklist_incomplete",
        condition: "checklist-incomplete",
        payload: {},
        sourceHref: "/tomorrow",
      }),
  },
  {
    id: "inbox-overflow",
    matches: (c) => (c.inbox?.unreadCount ?? 0) > UNREAD_INBOX_THRESHOLD,
    build: (c) =>
      draft({
        type: "reminder",
        priority: "low",
        title: "Your inbox is filling up",
        reason: `${c.inbox!.unreadCount} unprocessed items are waiting.`,
        source: "inbox",
        trigger: "inbox.overflow",
        condition: "overflow",
        payload: { count: c.inbox!.unreadCount },
        sourceHref: "/inbox",
      }),
  },
];

/** Run all rules against a context, returning every matched draft. */
export function generateDrafts(ctx: NotificationRuleContext): NotificationDraft[] {
  return NOTIFICATION_RULES.filter((r) => r.matches(ctx)).map((r) => r.build(ctx));
}

export function findRule(id: string): NotificationRule {
  const rule = NOTIFICATION_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Unknown notification rule: ${id}`);
  return rule;
}
