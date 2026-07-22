import { describe, expect, it } from "vitest";
import {
  createEventBus,
  publish,
  publishAll,
  drain,
  generateSignal,
  rankSignal,
  detectRisks,
  detectOpportunities,
  aggregateSignals,
  suppressSignals,
  decideNotification,
  levelForPriority,
  windowForTime,
  runEngine,
  currentSignals,
  riskSignals,
  opportunitySignals,
  signalCounts,
  type DomainEvent,
  type Signal,
} from "./index";

/**
 * Event Intelligence Engine (Sprint 6.1). Pure, deterministic: events → signals → ranked, aggregated,
 * suppressed, notification-decided. Signals never mutate anything. All time is injected.
 */

let counter = 0;
const newId = () => `s${(counter += 1)}`;
const now = new Date("2026-07-20T10:00:00.000Z");
const deps = { newId, now };

const ev = (over: Partial<DomainEvent>): DomainEvent => ({
  id: `e${counter}`,
  source: "task",
  kind: "task.completed",
  at: now.toISOString(),
  payload: {},
  ...over,
});

describe("event bus — transport only", () => {
  it("publishes and drains events immutably", () => {
    const bus0 = createEventBus();
    const bus1 = publish(bus0, ev({ id: "e1" }));
    const bus2 = publishAll(bus1, [ev({ id: "e2" }), ev({ id: "e3" })]);
    expect(bus0.events).toHaveLength(0); // original untouched
    expect(bus2.events).toHaveLength(3);
    const { events, bus } = drain(bus2);
    expect(events).toHaveLength(3);
    expect(bus.events).toHaveLength(0);
  });
});

describe("signal generation", () => {
  it("maps a known event to a signal; unknown → null", () => {
    const s = generateSignal(
      ev({
        id: "e1",
        ref: { module: "task", id: "t1", label: "Ship 6.1" },
        payload: { completedToday: 3 },
      }),
      deps,
    );
    expect(s?.category).toBe("productivity");
    expect(s?.explanation.headline).toBe("Sprint progress increasing");
    expect(s?.status).toBe("active");
    expect(generateSignal(ev({ kind: "task.unknown_thing" }), deps)).toBeNull();
  });
  it("turns a cancelled meeting into an opportunity signal with an expiry", () => {
    const s = generateSignal(
      ev({
        source: "calendar",
        kind: "calendar.meeting_cancelled",
        ref: { module: "calendar", id: "m1", label: "Standup" },
        payload: { minutes: 90 },
      }),
      deps,
    );
    expect(s?.category).toBe("opportunities");
    expect(s?.expiresAt).not.toBeNull();
  });
});

describe("ranking — deterministic, no AI", () => {
  it("ranks a critical risk above an info productivity signal", () => {
    const risk = generateSignal(
      ev({
        source: "task",
        kind: "task.deadline_at_risk",
        ref: { module: "task", id: "t1" },
        payload: { daysRemaining: 1, estimateHours: 10 },
      }),
      deps,
    )!;
    const prod = generateSignal(
      ev({ kind: "task.completed", payload: { completedToday: 1 } }),
      deps,
    )!;
    expect(rankSignal(risk, now).priority).toBeGreaterThan(rankSignal(prod, now).priority);
  });
  it("recency decays with age", () => {
    const s = generateSignal(ev({ kind: "task.completed" }), deps)!;
    const fresh = rankSignal(s, now).recency;
    const stale = rankSignal(s, new Date(now.getTime() + 24 * 3600_000)).recency;
    expect(fresh).toBeGreaterThan(stale);
  });
});

describe("risk + opportunity detection", () => {
  it("detects deadline, burnout, focus, consistency and prep risks", () => {
    const risks = detectRisks(
      {
        deadlines: [
          { id: "d1", label: "Essay", daysRemaining: 1, estimateHours: 8, availableHours: 3 },
        ],
        readiness: 20,
        meetingsToday: 6,
        daysSinceWorkout: 5,
        exams: [{ id: "x1", label: "Exam", daysRemaining: 3, prepared: false }],
      },
      deps,
    );
    const headlines = risks.map((r) => r.explanation.headline);
    expect(headlines).toEqual(
      expect.arrayContaining([
        "Deadline risk",
        "Burnout risk",
        "Focus risk",
        "Health consistency risk",
        "Preparation risk",
      ]),
    );
    expect(risks.every((r) => r.category === "risks")).toBe(true);
  });
  it("detects free-window, early-completion, deep-work and resume opportunities", () => {
    const opps = detectOpportunities(
      {
        freedMinutes: 90,
        earlyCompletion: { id: "t1", label: "Report" },
        readiness: 82,
        freeEvening: true,
        resumableProject: { id: "p1", label: "Internship" },
      },
      deps,
    );
    expect(opps.length).toBe(4);
    expect(opps.every((o) => o.category === "opportunities")).toBe(true);
  });
});

describe("aggregation — anti-spam", () => {
  it("collapses ≥3 same-category signals into one summary", () => {
    const many: Signal[] = [1, 2, 3, 4].map((i) =>
      generateSignal(
        ev({
          id: `e${i}`,
          kind: "planner.schedule_slipping",
          source: "planner",
          payload: { missed: i },
        }),
        deps,
      )!,
    );
    const agg = aggregateSignals(many, deps);
    expect(agg).toHaveLength(1);
    expect(agg[0]!.explanation.headline).toBe("Schedule slipping");
  });
});

describe("suppression — dedupe / supersede / escalate / expire", () => {
  it("supersedes a prior signal with the same dedupeKey and escalates repeated risks", () => {
    const prior = generateSignal(
      ev({
        kind: "task.deadline_at_risk",
        ref: { module: "task", id: "t1" },
        payload: { daysRemaining: 3, estimateHours: 5 },
      }),
      deps,
    )!;
    const fresh = generateSignal(
      ev({
        kind: "task.deadline_at_risk",
        ref: { module: "task", id: "t1" },
        payload: { daysRemaining: 3, estimateHours: 5 },
      }),
      deps,
    )!;
    const res = suppressSignals([fresh], [prior], now);
    expect(res.transitions.some((t) => t.to === "superseded")).toBe(true);
    // deadline_at_risk is "high" → escalates to "critical"
    expect(res.active[0]!.severity).toBe("critical");
  });
  it("expires a prior signal past its expiry", () => {
    const old: Signal = {
      ...generateSignal(ev({ kind: "task.completed" }), deps)!,
      expiresAt: new Date(now.getTime() - 1000).toISOString(),
    };
    const res = suppressSignals([], [old], now);
    expect(res.transitions.some((t) => t.to === "expired")).toBe(true);
    expect(res.active).toHaveLength(0);
  });
});

describe("notification decisions", () => {
  it("maps priority to a level and escalates critical severity", () => {
    expect(levelForPriority(90)).toBe("critical");
    expect(levelForPriority(10)).toBe("silent");
    const lvl = decideNotification(
      { importance: 0.5, urgency: 0.2, confidence: 0.5, recency: 0.2, impact: 1, priority: 20 },
      "critical",
    );
    expect(lvl).toBe("important"); // critical severity floors to important even at low priority
  });
});

describe("context windows", () => {
  it("classifies a target time into a window", () => {
    expect(windowForTime(now.toISOString(), now)).toBe("current");
    expect(windowForTime(new Date(now.getTime() + 86_400_000).toISOString(), now)).toBe("tomorrow");
    expect(windowForTime(new Date(now.getTime() + 5 * 86_400_000).toISOString(), now)).toBe("week");
  });
});

describe("engine — full deterministic pass", () => {
  it("generates, detects, ranks and decides notifications; nothing mutates user data", () => {
    const result = runEngine(
      {
        events: [
          ev({
            id: "e1",
            source: "calendar",
            kind: "calendar.meeting_cancelled",
            payload: { minutes: 90 },
          }),
        ],
        risk: {
          deadlines: [
            { id: "d1", label: "Essay", daysRemaining: 2, estimateHours: 8, availableHours: 3 },
          ],
          readiness: 30,
          meetingsToday: 1,
          daysSinceWorkout: 1,
          exams: [],
        },
        opportunity: {
          freedMinutes: 90,
          earlyCompletion: null,
          readiness: null,
          freeEvening: false,
          resumableProject: null,
        },
        previous: [],
      },
      deps,
    );
    expect(result.signals.length).toBeGreaterThan(0);
    // sorted by priority desc
    const priorities = result.signals.map((s) => s.ranking.priority);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
    // risks + opportunities both present
    expect(riskSignals(result.signals).length).toBeGreaterThan(0);
    expect(opportunitySignals(result.signals).length).toBeGreaterThan(0);
    // timeline records the audit trail
    expect(result.timeline.some((t) => t.kind === "signal_created")).toBe(true);
    expect(result.timeline.some((t) => t.kind === "event_received")).toBe(true);
    // counts
    const counts = signalCounts(result.signals);
    expect(counts.total).toBe(currentSignals(result.signals).length);
  });
});
