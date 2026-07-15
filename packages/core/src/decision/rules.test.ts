import { describe, expect, it } from "vitest";
import { DECISION_RULES, beforeWorkingHours, withinWorkingHours } from "./rules";
import { at, makeContext, makeFocus, makeMetrics, makeState } from "./fixtures";

const rule = (id: string) => {
  const found = DECISION_RULES.find((r) => r.id === id);
  if (!found) throw new Error(`no rule ${id}`);
  return found;
};

describe("time helpers", () => {
  it("withinWorkingHours / beforeWorkingHours", () => {
    expect(withinWorkingHours(makeContext({ now: at(10) }))).toBe(true);
    expect(withinWorkingHours(makeContext({ now: at(7) }))).toBe(false);
    expect(beforeWorkingHours(makeContext({ now: at(7) }))).toBe(true);
    expect(beforeWorkingHours(makeContext({ now: at(10) }))).toBe(false);
  });
});

describe("decision rules — matching", () => {
  it("continue-mission fires within hours with a mission", () => {
    expect(
      rule("continue-mission").matches(
        makeContext({ now: at(10), focus: makeFocus({ mission: "Ship" }) }),
      ),
    ).toBe(true);
    expect(rule("continue-mission").matches(makeContext({ now: at(10) }))).toBe(false);
    expect(
      rule("continue-mission").matches(
        makeContext({ now: at(7), focus: makeFocus({ mission: "Ship" }) }),
      ),
    ).toBe(false);
  });

  it("no-mission fires when the mission is blank", () => {
    expect(rule("no-mission").matches(makeContext())).toBe(true);
    expect(rule("no-mission").matches(makeContext({ focus: makeFocus({ mission: "Ship" }) }))).toBe(
      false,
    );
  });

  it("high-interruptions fires above the threshold", () => {
    expect(
      rule("high-interruptions").matches(
        makeContext({ metrics: makeMetrics({ interruptions: 11 }) }),
      ),
    ).toBe(true);
    expect(
      rule("high-interruptions").matches(
        makeContext({ metrics: makeMetrics({ interruptions: 10 }) }),
      ),
    ).toBe(false);
  });

  it("before-hours-prepare fires before the start", () => {
    expect(rule("before-hours-prepare").matches(makeContext({ now: at(7) }))).toBe(true);
    expect(rule("before-hours-prepare").matches(makeContext({ now: at(10) }))).toBe(false);
  });

  it("low-energy fires for low energy", () => {
    expect(
      rule("low-energy").matches(makeContext({ state: makeState({ energyLevel: "low" }) })),
    ).toBe(true);
  });

  it("log-wake-time fires within hours without a wake time", () => {
    expect(rule("log-wake-time").matches(makeContext({ now: at(10) }))).toBe(true);
    expect(
      rule("log-wake-time").matches(
        makeContext({ now: at(10), state: makeState({ wakeTime: "07:00" }) }),
      ),
    ).toBe(false);
  });

  it("inbox-overflow fires only above the threshold", () => {
    expect(rule("inbox-overflow").matches(makeContext({ inboxCount: 11 }))).toBe(true);
    expect(rule("inbox-overflow").matches(makeContext({ inboxCount: 10 }))).toBe(false);
    expect(rule("inbox-overflow").matches(makeContext({ inboxCount: 0 }))).toBe(false);
  });

  it("critical-milestone-due fires within hours when a milestone is due soon", () => {
    const ctx = makeContext({
      now: at(10),
      project: { criticalMilestones: [{ projectName: "Campus AI", title: "Alpha", dueInDays: 2 }] },
    });
    expect(rule("critical-milestone-due").matches(ctx)).toBe(true);
    expect(rule("critical-milestone-due").matches(makeContext({ now: at(10) }))).toBe(false);
    // Outside working hours it stays quiet.
    expect(
      rule("critical-milestone-due").matches(
        makeContext({
          now: at(7),
          project: { criticalMilestones: [{ projectName: "P", title: "M", dueInDays: 0 }] },
        }),
      ),
    ).toBe(false);
  });

  it("project-at-risk fires within hours when projects are at risk", () => {
    expect(
      rule("project-at-risk").matches(makeContext({ now: at(10), project: { atRiskCount: 2 } })),
    ).toBe(true);
    expect(
      rule("project-at-risk").matches(makeContext({ now: at(10), project: { atRiskCount: 0 } })),
    ).toBe(false);
  });

  it("budget-exceeded fires when a category is over budget", () => {
    expect(
      rule("budget-exceeded").matches(
        makeContext({ finance: { overBudgetCategories: ["dining"] } }),
      ),
    ).toBe(true);
    expect(
      rule("budget-exceeded").matches(makeContext({ finance: { overBudgetCategories: [] } })),
    ).toBe(false);
  });

  it("large-payment-due fires when a payment is due today", () => {
    expect(
      rule("large-payment-due").matches(
        makeContext({ finance: { largePaymentDueToday: { name: "Rent", amount: 15000 } } }),
      ),
    ).toBe(true);
    expect(rule("large-payment-due").matches(makeContext())).toBe(false);
  });

  it("savings-nearly-complete fires near a goal", () => {
    expect(
      rule("savings-nearly-complete").matches(
        makeContext({ finance: { savingsNearlyComplete: { title: "Fund", remaining: 5000 } } }),
      ),
    ).toBe(true);
  });

  it("goal-behind-schedule fires within hours when a goal is behind", () => {
    expect(
      rule("goal-behind-schedule").matches(
        makeContext({ now: at(10), goal: { behindGoals: [{ title: "Ship v2", progress: 40 }] } }),
      ),
    ).toBe(true);
    expect(
      rule("goal-behind-schedule").matches(makeContext({ now: at(10), goal: { behindGoals: [] } })),
    ).toBe(false);
  });

  it("habit-streak-at-risk fires when a habit is at risk", () => {
    expect(
      rule("habit-streak-at-risk").matches(
        makeContext({ goal: { habitsAtRisk: [{ title: "Meditate" }] } }),
      ),
    ).toBe(true);
    expect(rule("habit-streak-at-risk").matches(makeContext({ goal: { habitsAtRisk: [] } }))).toBe(
      false,
    );
  });

  it("quarter-ending-review fires when the quarter is ending", () => {
    expect(
      rule("quarter-ending-review").matches(makeContext({ goal: { quarterEnding: true } })),
    ).toBe(true);
    expect(
      rule("quarter-ending-review").matches(makeContext({ goal: { quarterEnding: false } })),
    ).toBe(false);
  });

  it("planner-accuracy-falling fires within hours on a downward trend", () => {
    expect(
      rule("planner-accuracy-falling").matches(
        makeContext({ now: at(10), analytics: { plannerAccuracyFalling: true } }),
      ),
    ).toBe(true);
    expect(
      rule("planner-accuracy-falling").matches(
        makeContext({ now: at(10), analytics: { plannerAccuracyFalling: false } }),
      ),
    ).toBe(false);
  });

  it("goal-velocity-declining fires within hours", () => {
    expect(
      rule("goal-velocity-declining").matches(
        makeContext({ now: at(10), analytics: { goalVelocityDeclining: true } }),
      ),
    ).toBe(true);
    expect(rule("goal-velocity-declining").matches(makeContext({ now: at(10) }))).toBe(false);
  });

  it("productivity-trend-falling fires + swaps title when meeting-heavy", () => {
    expect(
      rule("productivity-trend-falling").matches(
        makeContext({ analytics: { productivityTrendFalling: true } }),
      ),
    ).toBe(true);
    const meetingHeavy = rule("productivity-trend-falling").build(
      makeContext({ analytics: { productivityTrendFalling: true, meetingHeavy: true } }),
    );
    expect(meetingHeavy.title).toMatch(/Reduce meetings/);
    const focusLight = rule("productivity-trend-falling").build(
      makeContext({ analytics: { productivityTrendFalling: true, meetingHeavy: false } }),
    );
    expect(focusLight.title).toMatch(/deep-work block/);
  });

  it("tomorrow-too-much-unfinished fires when overloaded", () => {
    expect(
      rule("tomorrow-too-much-unfinished").matches(
        makeContext({ tomorrow: { tooMuchUnfinished: true } }),
      ),
    ).toBe(true);
    expect(rule("tomorrow-too-much-unfinished").matches(makeContext())).toBe(false);
  });

  it("tomorrow-heavy-meetings fires on a meeting-heavy tomorrow", () => {
    expect(
      rule("tomorrow-heavy-meetings").matches(makeContext({ tomorrow: { heavyMeetingDay: true } })),
    ).toBe(true);
  });

  it("tomorrow-low-readiness fires on low projected readiness", () => {
    expect(
      rule("tomorrow-low-readiness").matches(makeContext({ tomorrow: { lowReadiness: true } })),
    ).toBe(true);
    expect(
      rule("tomorrow-low-readiness").matches(makeContext({ tomorrow: { lowReadiness: false } })),
    ).toBe(false);
  });

  it("low-sleep-recovery fires within hours on low sleep", () => {
    expect(
      rule("low-sleep-recovery").matches(makeContext({ now: at(10), health: { lowSleep: true } })),
    ).toBe(true);
    expect(
      rule("low-sleep-recovery").matches(makeContext({ now: at(10), health: { lowSleep: false } })),
    ).toBe(false);
  });

  it("high-readiness-hard-task fires within hours on high readiness", () => {
    expect(
      rule("high-readiness-hard-task").matches(
        makeContext({ now: at(10), health: { highReadiness: true, readiness: 88 } }),
      ),
    ).toBe(true);
    expect(
      rule("high-readiness-hard-task").matches(
        makeContext({ now: at(10), health: { highReadiness: false } }),
      ),
    ).toBe(false);
  });

  it("protect-focus is the always-on fallback", () => {
    expect(rule("protect-focus").matches(makeContext())).toBe(true);
  });
});

describe("decision rules — build", () => {
  it("continue-mission uses the mission in the title + rich inputs", () => {
    const built = rule("continue-mission").build(
      makeContext({ now: at(10), focus: makeFocus({ mission: "Ship 2.3" }) }),
    );
    expect(built.title).toBe("Continue: Ship 2.3");
    expect(built.reason).toMatch(/Working hours have begun/);
    expect(built.inputsUsed).toContain("Mission");
    expect(built.confidence).toBe(92);
  });
  it("carries an expiry hint", () => {
    expect(rule("no-mission").build(makeContext()).expiresInMinutes).toBeGreaterThan(0);
  });

  it("critical-milestone-due names the milestone and due window", () => {
    const built = rule("critical-milestone-due").build(
      makeContext({
        now: at(10),
        project: {
          criticalMilestones: [{ projectName: "Campus AI", title: "Alpha", dueInDays: 3 }],
        },
      }),
    );
    expect(built.title).toContain("Alpha");
    expect(built.reason).toContain("Campus AI");
    expect(built.inputsUsed).toContain("Projects");
  });

  it("project-at-risk cites the at-risk count", () => {
    const built = rule("project-at-risk").build(
      makeContext({ now: at(10), project: { atRiskCount: 3 } }),
    );
    expect(built.reason).toContain("3");
    expect(built.inputsUsed).toContain("Health");
  });

  it("inbox-overflow reports the item count and cites the Inbox input", () => {
    const built = rule("inbox-overflow").build(makeContext({ inboxCount: 23 }));
    expect(built.title).toBe("Process your Inbox.");
    expect(built.reason).toContain("23");
    expect(built.inputsUsed).toContain("Inbox");
  });

  it("focus-too-many-interruptions fires on heavy interruptions", () => {
    expect(
      rule("focus-too-many-interruptions").matches(
        makeContext({ focusMode: { tooManyInterruptions: true } }),
      ),
    ).toBe(true);
    expect(rule("focus-too-many-interruptions").matches(makeContext())).toBe(false);
    const built = rule("focus-too-many-interruptions").build(makeContext());
    expect(built.inputsUsed).toContain("Focus");
  });

  it("focus-long-unfinished fires when overrunning unfinished work", () => {
    expect(
      rule("focus-long-unfinished").matches(makeContext({ focusMode: { longUnfinished: true } })),
    ).toBe(true);
    expect(rule("focus-long-unfinished").matches(makeContext())).toBe(false);
  });

  it("focus-planner-drift fires on off-plan focus", () => {
    expect(
      rule("focus-planner-drift").matches(makeContext({ focusMode: { plannerDrift: true } })),
    ).toBe(true);
    const built = rule("focus-planner-drift").build(makeContext());
    expect(built.inputsUsed).toContain("Planner");
  });

  it("notifications-too-many-ignored fires on overload", () => {
    expect(
      rule("notifications-too-many-ignored").matches(
        makeContext({ notifications: { tooManyIgnored: true } }),
      ),
    ).toBe(true);
    expect(rule("notifications-too-many-ignored").matches(makeContext())).toBe(false);
    expect(rule("notifications-too-many-ignored").build(makeContext()).inputsUsed).toContain(
      "Notifications",
    );
  });

  it("notifications-critical-overdue escalates", () => {
    expect(
      rule("notifications-critical-overdue").matches(
        makeContext({ notifications: { criticalOverdue: true } }),
      ),
    ).toBe(true);
    expect(rule("notifications-critical-overdue").priority).toBe("high");
  });

  it("notifications-repeated-snoozes suggests rescheduling", () => {
    expect(
      rule("notifications-repeated-snoozes").matches(
        makeContext({ notifications: { repeatedSnoozes: true } }),
      ),
    ).toBe(true);
    const built = rule("notifications-repeated-snoozes").build(makeContext());
    expect(built.title.toLowerCase()).toContain("reschedule");
  });

  it("automation-failures fires when automations fail", () => {
    expect(
      rule("automation-failures").matches(makeContext({ automation: { failuresToday: true } })),
    ).toBe(true);
    expect(rule("automation-failures").matches(makeContext())).toBe(false);
    expect(rule("automation-failures").build(makeContext()).inputsUsed).toContain("Automation");
  });

  it("automation-runaway escalates a misfiring rule", () => {
    expect(
      rule("automation-runaway").matches(makeContext({ automation: { runawayRule: true } })),
    ).toBe(true);
    expect(rule("automation-runaway").priority).toBe("high");
  });

  it("automation-pending-approvals surfaces waiting rules", () => {
    expect(
      rule("automation-pending-approvals").matches(
        makeContext({ automation: { pendingApprovals: true } }),
      ),
    ).toBe(true);
    expect(rule("automation-pending-approvals").build(makeContext()).title).toMatch(/[Aa]pprove/);
  });

  it("orchestration-failures fires when a pipeline fails", () => {
    expect(
      rule("orchestration-failures").matches(
        makeContext({ orchestration: { failuresToday: true } }),
      ),
    ).toBe(true);
    expect(rule("orchestration-failures").matches(makeContext())).toBe(false);
    expect(rule("orchestration-failures").priority).toBe("high");
    expect(rule("orchestration-failures").build(makeContext()).inputsUsed).toContain(
      "Orchestration",
    );
  });

  it("orchestration-recovery-required surfaces recovered runs", () => {
    expect(
      rule("orchestration-recovery-required").matches(
        makeContext({ orchestration: { recoveryRequired: true } }),
      ),
    ).toBe(true);
    expect(rule("orchestration-recovery-required").matches(makeContext())).toBe(false);
  });

  it("orchestration-pipelines-pending surfaces pending pipelines", () => {
    expect(
      rule("orchestration-pipelines-pending").matches(
        makeContext({ orchestration: { pipelinesPending: true } }),
      ),
    ).toBe(true);
    expect(rule("orchestration-pipelines-pending").priority).toBe("low");
  });
});
