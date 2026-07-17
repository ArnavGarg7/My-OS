import { minutesOfDay, timeToMinutes } from "../today";
import { INBOX_OVERFLOW_THRESHOLD, type DecisionPriority, type DecisionType } from "./constants";
import type { BuiltDecision, DecisionContext } from "./types";

/**
 * Decision rules (Sprint 2.3). Deterministic — each rule declares when it fires
 * and what decision it produces. No AI. Rules are the only place new decision
 * behaviour is added; future modules append their own.
 */
export interface DecisionRule {
  id: string;
  type: DecisionType;
  priority: DecisionPriority;
  /** Human name shown in explanations. */
  ruleName: string;
  matches: (ctx: DecisionContext) => boolean;
  build: (ctx: DecisionContext) => BuiltDecision;
}

export function withinWorkingHours(ctx: DecisionContext): boolean {
  const nowMin = minutesOfDay(ctx.now);
  return (
    nowMin >= timeToMinutes(ctx.workingHours.start) && nowMin < timeToMinutes(ctx.workingHours.end)
  );
}

export function beforeWorkingHours(ctx: DecisionContext): boolean {
  return minutesOfDay(ctx.now) < timeToMinutes(ctx.workingHours.start);
}

export const DECISION_RULES: DecisionRule[] = [
  {
    id: "continue-mission",
    type: "focus",
    priority: "high",
    ruleName: "Working hours have begun",
    matches: (ctx) => withinWorkingHours(ctx) && Boolean(ctx.focus?.mission?.trim()),
    build: (ctx) => ({
      title: `Continue: ${ctx.focus!.mission!.trim()}`,
      reason: "Working hours have begun and your mission is set.",
      confidence: 92,
      inputsUsed: ["Time", "Mission", "Energy", "Planner"],
      expiresInMinutes: 120,
    }),
  },
  {
    id: "no-mission",
    type: "mission",
    priority: "high",
    ruleName: "No mission defined",
    matches: (ctx) => !ctx.focus?.mission?.trim(),
    build: () => ({
      title: "Set your mission for today.",
      reason: "No mission is defined yet — everything else depends on it.",
      confidence: 82,
      inputsUsed: ["Mission"],
      expiresInMinutes: 180,
    }),
  },
  {
    id: "high-interruptions",
    type: "focus",
    priority: "high",
    ruleName: "Frequent interruptions",
    matches: (ctx) => (ctx.metrics?.interruptions ?? 0) > 10,
    build: () => ({
      title: "Turn on focus mode.",
      reason: "You've logged frequent interruptions today.",
      confidence: 68,
      inputsUsed: ["Metrics"],
      expiresInMinutes: 90,
    }),
  },
  {
    id: "before-hours-prepare",
    type: "system",
    priority: "medium",
    ruleName: "Before working hours",
    matches: (ctx) => beforeWorkingHours(ctx),
    build: () => ({
      title: "Prepare and set up your day.",
      reason: "Working hours haven't started yet.",
      confidence: 60,
      inputsUsed: ["Time"],
      expiresInMinutes: 120,
    }),
  },
  {
    id: "low-energy",
    type: "health",
    priority: "medium",
    ruleName: "Low energy",
    matches: (ctx) => ctx.state?.energyLevel === "low",
    build: () => ({
      title: "Switch to lighter, low-energy tasks.",
      reason: "Your energy is low right now.",
      confidence: 70,
      inputsUsed: ["Energy"],
      expiresInMinutes: 90,
    }),
  },
  {
    id: "morning-not-complete",
    type: "system",
    priority: "medium",
    ruleName: "Morning check-in incomplete",
    matches: (ctx) => !ctx.state?.morningCompleted,
    build: () => ({
      title: "Complete your morning check-in.",
      reason: "Your morning briefing isn't marked complete.",
      confidence: 55,
      inputsUsed: ["Time"],
      expiresInMinutes: 180,
    }),
  },
  {
    id: "inbox-overflow",
    type: "system",
    priority: "medium",
    ruleName: "Inbox is overflowing",
    matches: (ctx) => (ctx.inboxCount ?? 0) > INBOX_OVERFLOW_THRESHOLD,
    build: (ctx) => ({
      title: "Process your Inbox.",
      reason: `You have ${ctx.inboxCount} unprocessed items waiting.`,
      confidence: 65,
      inputsUsed: ["Inbox"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "critical-milestone-due",
    type: "project",
    priority: "high",
    ruleName: "A project milestone is due soon",
    matches: (ctx) => (ctx.project?.criticalMilestones?.length ?? 0) > 0 && withinWorkingHours(ctx),
    build: (ctx) => {
      const m = ctx.project!.criticalMilestones![0]!;
      const due =
        m.dueInDays <= 0 ? "today" : `in ${m.dueInDays} day${m.dueInDays === 1 ? "" : "s"}`;
      return {
        title: `Advance "${m.title}" — due ${due}.`,
        reason: `${m.projectName}'s milestone "${m.title}" is due ${due}.`,
        confidence: 78,
        inputsUsed: ["Projects", "Milestones", "Time"],
        expiresInMinutes: 240,
      };
    },
  },
  {
    id: "project-at-risk",
    type: "project",
    priority: "medium",
    ruleName: "A project is at risk",
    matches: (ctx) => (ctx.project?.atRiskCount ?? 0) > 0 && withinWorkingHours(ctx),
    build: (ctx) => {
      const n = ctx.project!.atRiskCount!;
      return {
        title: "Review your at-risk projects.",
        reason: `${n} project${n === 1 ? " is" : "s are"} at risk, behind, or blocked.`,
        confidence: 60,
        inputsUsed: ["Projects", "Health"],
        expiresInMinutes: 360,
      };
    },
  },
  {
    id: "low-sleep-recovery",
    type: "health",
    priority: "high",
    ruleName: "Low sleep — protect recovery",
    matches: (ctx) => ctx.health?.lowSleep === true && withinWorkingHours(ctx),
    build: () => ({
      title: "Ease up today — you're short on sleep.",
      reason:
        "Last night's sleep was below your healthy minimum; reduce deep work and prioritise recovery.",
      confidence: 72,
      inputsUsed: ["Health", "Sleep", "Recovery"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "high-readiness-hard-task",
    type: "health",
    priority: "medium",
    ruleName: "High readiness — go hard",
    matches: (ctx) => ctx.health?.highReadiness === true && withinWorkingHours(ctx),
    build: (ctx) => ({
      title: "You're primed — start your hardest task first.",
      reason: `Readiness is ${ctx.health!.readiness ?? "high"} — capitalise on it with your most demanding work.`,
      confidence: 68,
      inputsUsed: ["Health", "Readiness"],
      expiresInMinutes: 180,
    }),
  },
  {
    id: "budget-exceeded",
    type: "finance",
    priority: "high",
    ruleName: "A budget was exceeded",
    matches: (ctx) => (ctx.finance?.overBudgetCategories?.length ?? 0) > 0,
    build: (ctx) => {
      const cats = ctx.finance!.overBudgetCategories!;
      return {
        title: "Reduce discretionary spending.",
        reason: `You're over budget in ${cats.slice(0, 2).join(", ")}${cats.length > 2 ? "…" : ""}.`,
        confidence: 72,
        inputsUsed: ["Finance", "Budgets"],
        expiresInMinutes: 480,
      };
    },
  },
  {
    id: "large-payment-due",
    type: "finance",
    priority: "high",
    ruleName: "A large payment is due today",
    matches: (ctx) => ctx.finance?.largePaymentDueToday != null,
    build: (ctx) => {
      const p = ctx.finance!.largePaymentDueToday!;
      return {
        title: `Complete the ${p.name} payment.`,
        reason: `${p.name} (₹${Math.round(p.amount)}) is due today — pay it early.`,
        confidence: 70,
        inputsUsed: ["Finance", "Subscriptions"],
        expiresInMinutes: 240,
      };
    },
  },
  {
    id: "savings-nearly-complete",
    type: "finance",
    priority: "medium",
    ruleName: "A savings goal is nearly complete",
    matches: (ctx) => ctx.finance?.savingsNearlyComplete != null,
    build: (ctx) => {
      const g = ctx.finance!.savingsNearlyComplete!;
      return {
        title: `Finish your "${g.title}" savings goal.`,
        reason: `Only ₹${Math.round(g.remaining)} to go — transfer the remainder.`,
        confidence: 58,
        inputsUsed: ["Finance", "Savings"],
        expiresInMinutes: 720,
      };
    },
  },
  {
    id: "goal-behind-schedule",
    type: "goal",
    priority: "high",
    ruleName: "A goal is behind schedule",
    matches: (ctx) => (ctx.goal?.behindGoals?.length ?? 0) > 0 && withinWorkingHours(ctx),
    build: (ctx) => {
      const g = ctx.goal!.behindGoals![0]!;
      return {
        title: `Advance "${g.title}" — it's behind.`,
        reason: `"${g.title}" is at ${g.progress}% and behind schedule. Prioritise a related project.`,
        confidence: 68,
        inputsUsed: ["Goals", "Forecast", "Time"],
        expiresInMinutes: 360,
      };
    },
  },
  {
    id: "habit-streak-at-risk",
    type: "goal",
    priority: "high",
    ruleName: "A habit streak is about to break",
    matches: (ctx) => (ctx.goal?.habitsAtRisk?.length ?? 0) > 0,
    build: (ctx) => {
      const h = ctx.goal!.habitsAtRisk![0]!;
      return {
        title: `Complete "${h.title}" today.`,
        reason: `Your "${h.title}" streak is about to break — log it to keep momentum.`,
        confidence: 66,
        inputsUsed: ["Goals", "Habits"],
        expiresInMinutes: 480,
      };
    },
  },
  {
    id: "quarter-ending-review",
    type: "goal",
    priority: "medium",
    ruleName: "The quarter is ending",
    matches: (ctx) => ctx.goal?.quarterEnding === true,
    build: () => ({
      title: "Review your quarterly goals.",
      reason: "The quarter is ending — reflect on progress and set next quarter's focus.",
      confidence: 55,
      inputsUsed: ["Goals", "Reviews", "Time"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "planner-accuracy-falling",
    type: "planner",
    priority: "medium",
    ruleName: "Planner accuracy is falling",
    matches: (ctx) => ctx.analytics?.plannerAccuracyFalling === true && withinWorkingHours(ctx),
    build: () => ({
      title: "Review today's schedule.",
      reason: "Your planner accuracy is trending down — re-plan to match reality.",
      confidence: 64,
      inputsUsed: ["Analytics", "Planner", "Trends"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "goal-velocity-declining",
    type: "goal",
    priority: "medium",
    ruleName: "Goal velocity is declining",
    matches: (ctx) => ctx.analytics?.goalVelocityDeclining === true && withinWorkingHours(ctx),
    build: () => ({
      title: "Prioritise a blocked project.",
      reason: "Goal velocity is slowing — unblock the work that moves your goals.",
      confidence: 62,
      inputsUsed: ["Analytics", "Goals", "Projects"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "productivity-trend-falling",
    type: "focus",
    priority: "medium",
    ruleName: "Productivity trend is falling",
    matches: (ctx) => ctx.analytics?.productivityTrendFalling === true,
    build: (ctx) => ({
      title: ctx.analytics?.meetingHeavy
        ? "Reduce meetings to protect focus."
        : "Protect a deep-work block.",
      reason: "Your productivity trend is down week over week — reclaim focused time.",
      confidence: 60,
      inputsUsed: ["Analytics", "Productivity", "Calendar"],
      expiresInMinutes: 300,
    }),
  },
  {
    id: "tomorrow-too-much-unfinished",
    type: "planner",
    priority: "medium",
    ruleName: "Too much unfinished work for tomorrow",
    matches: (ctx) => ctx.tomorrow?.tooMuchUnfinished === true,
    build: () => ({
      title: "Reduce tomorrow's workload.",
      reason: "A lot is carrying forward — in Tomorrow Studio, keep only the vital few.",
      confidence: 63,
      inputsUsed: ["Tomorrow", "Tasks", "Planner"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "tomorrow-heavy-meetings",
    type: "focus",
    priority: "medium",
    ruleName: "Tomorrow is meeting-heavy",
    matches: (ctx) => ctx.tomorrow?.heavyMeetingDay === true,
    build: () => ({
      title: "Schedule deep work early tomorrow.",
      reason: "Tomorrow is meeting-heavy — protect a morning focus block before they start.",
      confidence: 61,
      inputsUsed: ["Tomorrow", "Calendar"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "tomorrow-low-readiness",
    type: "health",
    priority: "medium",
    ruleName: "Low readiness for tomorrow",
    matches: (ctx) => ctx.tomorrow?.lowReadiness === true,
    build: () => ({
      title: "Lower tomorrow's intensity.",
      reason: "Your projected readiness is low — plan a lighter day and protect recovery.",
      confidence: 60,
      inputsUsed: ["Tomorrow", "Health", "Readiness"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "focus-too-many-interruptions",
    type: "focus",
    priority: "high",
    ruleName: "Focus session heavily interrupted",
    matches: (ctx) => ctx.focusMode?.tooManyInterruptions === true,
    build: () => ({
      title: "Take a break to reset.",
      reason:
        "Your focus session has been interrupted repeatedly — step away briefly and silence notifications.",
      confidence: 66,
      inputsUsed: ["Focus", "Interruptions"],
      expiresInMinutes: 60,
    }),
  },
  {
    id: "focus-long-unfinished",
    type: "focus",
    priority: "medium",
    ruleName: "Focus session running long unfinished",
    matches: (ctx) => ctx.focusMode?.longUnfinished === true,
    build: () => ({
      title: "Wrap up or take a break.",
      reason:
        "You're well past this session's plan — finish the task or pause before fatigue sets in.",
      confidence: 62,
      inputsUsed: ["Focus", "Timer"],
      expiresInMinutes: 60,
    }),
  },
  {
    id: "focus-planner-drift",
    type: "planner",
    priority: "medium",
    ruleName: "Focusing off-plan",
    matches: (ctx) => ctx.focusMode?.plannerDrift === true,
    build: () => ({
      title: "Return to your planner.",
      reason:
        "You're focusing on unplanned work while planner blocks wait — realign with your plan.",
      confidence: 58,
      inputsUsed: ["Focus", "Planner"],
      expiresInMinutes: 120,
    }),
  },
  {
    id: "notifications-too-many-ignored",
    type: "system",
    priority: "medium",
    ruleName: "Too many ignored notifications",
    matches: (ctx) => ctx.notifications?.tooManyIgnored === true,
    build: () => ({
      title: "Clear your notifications.",
      reason: "A pile of notifications is going unread — process or dismiss them.",
      confidence: 60,
      inputsUsed: ["Notifications"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "notifications-critical-overdue",
    type: "system",
    priority: "high",
    ruleName: "Critical notification overdue",
    matches: (ctx) => ctx.notifications?.criticalOverdue === true,
    build: () => ({
      title: "Handle a critical notification.",
      reason: "A critical notification is overdue — it needs your attention now.",
      confidence: 76,
      inputsUsed: ["Notifications"],
      expiresInMinutes: 120,
    }),
  },
  {
    id: "notifications-repeated-snoozes",
    type: "system",
    priority: "low",
    ruleName: "Repeated snoozes",
    matches: (ctx) => ctx.notifications?.repeatedSnoozes === true,
    build: () => ({
      title: "Reschedule what you keep snoozing.",
      reason: "You've snoozed the same notification repeatedly — plan a real time for it.",
      confidence: 55,
      inputsUsed: ["Notifications"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "automation-failures",
    type: "system",
    priority: "medium",
    ruleName: "Automations failing",
    matches: (ctx) => ctx.automation?.failuresToday === true,
    build: () => ({
      title: "Review your failing automations.",
      reason: "One or more automations failed to run today — check the Automation Center.",
      confidence: 62,
      inputsUsed: ["Automation"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "automation-runaway",
    type: "system",
    priority: "high",
    ruleName: "Runaway automation",
    matches: (ctx) => ctx.automation?.runawayRule === true,
    build: () => ({
      title: "A rule is firing too often.",
      reason:
        "An automation has executed an unusual number of times today — consider a cooldown or disabling it.",
      confidence: 70,
      inputsUsed: ["Automation"],
      expiresInMinutes: 180,
    }),
  },
  {
    id: "automation-pending-approvals",
    type: "system",
    priority: "low",
    ruleName: "Automations awaiting approval",
    matches: (ctx) => ctx.automation?.pendingApprovals === true,
    build: () => ({
      title: "Approve pending automations.",
      reason: "Some automations are waiting for your manual approval to run.",
      confidence: 55,
      inputsUsed: ["Automation"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "orchestration-failures",
    type: "system",
    priority: "high",
    ruleName: "Orchestration failing",
    matches: (ctx) => ctx.orchestration?.failuresToday === true,
    build: () => ({
      title: "A cross-module pipeline failed today.",
      reason:
        "One or more orchestration pipelines failed to complete — open the Orchestration Center to review.",
      confidence: 68,
      inputsUsed: ["Orchestration"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "orchestration-recovery-required",
    type: "system",
    priority: "medium",
    ruleName: "Orchestration recovered from a failure",
    matches: (ctx) => ctx.orchestration?.recoveryRequired === true,
    build: () => ({
      title: "Review a recovered pipeline run.",
      reason:
        "The system recovered from a failed step. Check what was skipped so nothing important was missed.",
      confidence: 58,
      inputsUsed: ["Orchestration"],
      expiresInMinutes: 300,
    }),
  },
  {
    id: "orchestration-pipelines-pending",
    type: "system",
    priority: "low",
    ruleName: "Pipelines pending",
    matches: (ctx) => ctx.orchestration?.pipelinesPending === true,
    build: () => ({
      title: "Some pipelines are waiting to run.",
      reason: "Cross-module updates are pending — run them to keep every engine in sync.",
      confidence: 52,
      inputsUsed: ["Orchestration"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "flashcards-overdue",
    type: "system",
    priority: "medium",
    ruleName: "Flashcards overdue",
    matches: (ctx) => ctx.knowledge?.flashcardsOverdue === true,
    build: () => ({
      title: "Review your due flashcards.",
      reason: "You have flashcards due for review — a few minutes now protects your retention.",
      confidence: 64,
      inputsUsed: ["Knowledge"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "book-stalled",
    type: "system",
    priority: "low",
    ruleName: "Book stalled",
    matches: (ctx) => ctx.knowledge?.bookStalled === true,
    build: () => ({
      title: "Pick your book back up.",
      reason: "A book you're reading hasn't moved in a while — read a few pages to keep momentum.",
      confidence: 55,
      inputsUsed: ["Knowledge"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "course-deadline",
    type: "system",
    priority: "medium",
    ruleName: "Course needs finishing",
    matches: (ctx) => ctx.knowledge?.courseDeadline === true,
    build: () => ({
      title: "Finish what you started.",
      reason: "A course is well underway but idle — a focused session could get it done.",
      confidence: 60,
      inputsUsed: ["Knowledge"],
      expiresInMinutes: 300,
    }),
  },
  {
    id: "research-inactive",
    type: "system",
    priority: "low",
    ruleName: "Research inactive",
    matches: (ctx) => ctx.knowledge?.researchInactive === true,
    build: () => ({
      title: "Revisit your research.",
      reason: "An open investigation has gone quiet — capture where you left off before it fades.",
      confidence: 54,
      inputsUsed: ["Knowledge"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "learning-goal-falling",
    type: "system",
    priority: "medium",
    ruleName: "Learning slipping",
    matches: (ctx) => ctx.knowledge?.learningGoalFalling === true,
    build: () => ({
      title: "Your learning is slipping.",
      reason: "Reviews are piling up while active learning is low — protect a block for it today.",
      confidence: 62,
      inputsUsed: ["Knowledge"],
      expiresInMinutes: 300,
    }),
  },
  {
    id: "habit-streak-at-risk-today",
    type: "system",
    priority: "high",
    ruleName: "Habit streak at risk",
    matches: (ctx) => ctx.life?.habitStreakAtRisk === true,
    build: () => ({
      title: "Protect your streak — a habit is still undone.",
      reason: "A habit due today hasn't been completed and the day is running out.",
      confidence: 74,
      inputsUsed: ["Life", "Habits"],
      expiresInMinutes: 180,
    }),
  },
  {
    id: "routine-skipped",
    type: "system",
    priority: "low",
    ruleName: "Routine skipped",
    matches: (ctx) => ctx.life?.routineSkipped === true,
    build: () => ({
      title: "You skipped a routine today.",
      reason:
        "An active routine passed its window without being run — reset it or adjust the time.",
      confidence: 56,
      inputsUsed: ["Life", "Routines"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "low-recovery",
    type: "health",
    priority: "high",
    ruleName: "Low recovery",
    matches: (ctx) => ctx.life?.lowRecovery === true,
    build: () => ({
      title: "Ease off — your recovery is low.",
      reason:
        "Readiness inputs point to poor recovery; favour rest, mobility and lighter work today.",
      confidence: 72,
      inputsUsed: ["Life", "Readiness", "Recovery"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "doctor-appointment",
    type: "health",
    priority: "medium",
    ruleName: "Doctor appointment soon",
    matches: (ctx) => ctx.life?.doctorAppointment === true,
    build: () => ({
      title: "You have a doctor appointment coming up.",
      reason:
        "An appointment falls within the next couple of days — prepare questions + documents.",
      confidence: 66,
      inputsUsed: ["Life", "Appointments"],
      expiresInMinutes: 480,
    }),
  },
  {
    id: "medication-due",
    type: "health",
    priority: "high",
    ruleName: "Medication due",
    matches: (ctx) => ctx.life?.medicationDue === true,
    build: () => ({
      title: "Take your medication.",
      reason: "One or more doses are still owed today.",
      confidence: 80,
      inputsUsed: ["Life", "Medication"],
      expiresInMinutes: 120,
    }),
  },
  {
    id: "training-load-high",
    type: "health",
    priority: "medium",
    ruleName: "Training load high",
    matches: (ctx) => ctx.life?.trainingLoadHigh === true,
    build: () => ({
      title: "Your training load is high this week.",
      reason: "Weekly volume is above your high-load threshold — plan a deload or a rest day.",
      confidence: 64,
      inputsUsed: ["Life", "Workouts"],
      expiresInMinutes: 360,
    }),
  },
  {
    id: "identity-goal-stalled",
    type: "system",
    priority: "low",
    ruleName: "Identity goal stalled",
    matches: (ctx) => ctx.life?.identityGoalStalled === true,
    build: () => ({
      title: "Reconnect with who you're becoming.",
      reason: "An identity commitment hasn't moved lately — revisit it in your growth dashboard.",
      confidence: 52,
      inputsUsed: ["Life", "Growth"],
      expiresInMinutes: 480,
    }),
  },
  {
    id: "insurance-expiring",
    type: "system",
    priority: "high",
    ruleName: "Insurance expiring",
    matches: (ctx) => ctx.resources?.insuranceExpiring === true,
    build: () => ({
      title: "A policy is about to lapse — renew it.",
      reason:
        "Insurance cover expires inside the renewal window; a gap in cover is the expensive kind of mistake.",
      confidence: 78,
      inputsUsed: ["Resources", "Insurance"],
      expiresInMinutes: 480,
    }),
  },
  {
    id: "document-expiring",
    type: "system",
    priority: "medium",
    ruleName: "Document expiring",
    matches: (ctx) => ctx.resources?.documentExpiring === true,
    build: () => ({
      title: "An identity document is expiring.",
      reason:
        "A passport, licence or travel document is inside its renewal window — these take weeks, not days.",
      confidence: 70,
      inputsUsed: ["Resources", "Documents"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "maintenance-overdue",
    type: "system",
    priority: "medium",
    ruleName: "Maintenance overdue",
    matches: (ctx) => ctx.resources?.maintenanceOverdue === true,
    build: () => ({
      title: "Something you own is overdue for upkeep.",
      reason:
        "Scheduled maintenance has passed its due date — deferred upkeep gets more expensive, not less.",
      confidence: 66,
      inputsUsed: ["Resources", "Maintenance"],
      expiresInMinutes: 480,
    }),
  },
  {
    id: "relationship-cold",
    type: "system",
    priority: "low",
    ruleName: "Relationship cooling",
    matches: (ctx) => ctx.resources?.relationshipCold === true,
    build: () => ({
      title: "Someone you care about has gone quiet.",
      reason:
        "A relationship has passed the cold threshold with no contact — reach out before it goes dormant.",
      confidence: 58,
      inputsUsed: ["Resources", "Relationships"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "portfolio-unbalanced",
    type: "system",
    priority: "low",
    ruleName: "Portfolio concentrated",
    matches: (ctx) => ctx.resources?.portfolioUnbalanced === true,
    build: () => ({
      title: "Your portfolio is concentrated in one asset type.",
      reason:
        "A single investment type exceeds the concentration limit. This is an observation, not advice — the decision is yours.",
      confidence: 54,
      inputsUsed: ["Resources", "Investments"],
      expiresInMinutes: 1440,
    }),
  },
  {
    id: "large-expense-due",
    type: "system",
    priority: "medium",
    ruleName: "Large expense due",
    matches: (ctx) => ctx.resources?.largeExpenseDue === true,
    build: () => ({
      title: "A large expense is coming up.",
      reason:
        "A forecast obligation is above the large-expense threshold — make sure the cash is there.",
      confidence: 68,
      inputsUsed: ["Resources", "Forecast"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "investment-review-due",
    type: "system",
    priority: "low",
    ruleName: "Investment review due",
    matches: (ctx) => ctx.resources?.investmentReviewDue === true,
    build: () => ({
      title: "Your investments haven't been reviewed in a while.",
      reason:
        "The last portfolio review is older than the review cadence — prices are only as good as your last update.",
      confidence: 50,
      inputsUsed: ["Resources", "Investments"],
      expiresInMinutes: 1440,
    }),
  },
  {
    id: "multiple-life-areas-declining",
    type: "system",
    priority: "high",
    ruleName: "Multiple life areas declining",
    matches: (ctx) => ctx.dashboard?.multipleAreasDeclining === true,
    build: () => ({
      title: "Several areas of your life are slipping at once.",
      reason:
        "Three or more life areas fell versus the previous period — step back and rebalance before it compounds.",
      confidence: 74,
      inputsUsed: ["Dashboard", "Life areas"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "overall-health-low",
    type: "system",
    priority: "high",
    ruleName: "Overall life score low",
    matches: (ctx) => ctx.dashboard?.overallHealthLow === true,
    build: () => ({
      title: "Your overall life score is low right now.",
      reason:
        "The weighted rollup across all eight areas is below the healthy line — pick one area to lift.",
      confidence: 70,
      inputsUsed: ["Dashboard"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "overall-growth-positive",
    type: "system",
    priority: "low",
    ruleName: "Strong overall momentum",
    matches: (ctx) => ctx.dashboard?.overallGrowthPositive === true,
    build: () => ({
      title: "You're carrying strong momentum across your life.",
      reason:
        "Your overall life score is in the top band — a good moment to take on something ambitious.",
      confidence: 55,
      inputsUsed: ["Dashboard"],
      expiresInMinutes: 1440,
    }),
  },
  {
    id: "review-due",
    type: "system",
    priority: "medium",
    ruleName: "Review due",
    matches: (ctx) => ctx.dashboard?.reviewDue === true,
    build: () => ({
      title: "A periodic review is due.",
      reason:
        "A weekly, monthly, quarterly or yearly review has passed its cadence — capture a snapshot.",
      confidence: 62,
      inputsUsed: ["Dashboard", "Reviews"],
      expiresInMinutes: 720,
    }),
  },
  {
    id: "life-balance-low",
    type: "system",
    priority: "medium",
    ruleName: "Life balance uneven",
    matches: (ctx) => ctx.dashboard?.lifeBalanceLow === true,
    build: () => ({
      title: "Your life is unevenly balanced.",
      reason:
        "The gap between your strongest and weakest area is wide — the weakest is worth deliberate attention.",
      confidence: 60,
      inputsUsed: ["Dashboard", "Wheel of Life"],
      expiresInMinutes: 1440,
    }),
  },
  {
    id: "attention-overload",
    type: "system",
    priority: "high",
    ruleName: "Attention overload",
    matches: (ctx) => ctx.dashboard?.attentionOverload === true,
    build: () => ({
      title: "Too many things need attention at once.",
      reason:
        "More than five items are flagged needs-attention — triage the priority matrix rather than tackling all.",
      confidence: 68,
      inputsUsed: ["Dashboard", "Attention"],
      expiresInMinutes: 480,
    }),
  },
  {
    id: "log-wake-time",
    type: "sleep",
    priority: "low",
    ruleName: "Wake time not logged",
    matches: (ctx) => !ctx.state?.wakeTime && withinWorkingHours(ctx),
    build: () => ({
      title: "Log your wake time.",
      reason: "No wake time is recorded for today.",
      confidence: 50,
      inputsUsed: ["Sleep"],
      expiresInMinutes: 240,
    }),
  },
  {
    id: "protect-focus",
    type: "focus",
    priority: "low",
    ruleName: "All set",
    matches: () => true,
    build: () => ({
      title: "Protect your focus and start your top priority.",
      reason: "Everything's defined for a strong block of work.",
      confidence: 45,
      inputsUsed: ["Focus"],
      expiresInMinutes: 120,
    }),
  },
];
