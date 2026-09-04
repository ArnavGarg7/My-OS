import { describe, expect, it } from "vitest";
import { evaluateProactive, inCooldown, applyCooldown } from "./index";
import type {
  ProactiveContext,
  ProactiveSignalInput,
  ProactiveWorkloadInput,
  ResolvedCondition,
} from "./index";

/**
 * Proactive evaluator (Stage 6). Deterministic: same inputs → same interventions. Every
 * intervention is grounded, thresholded, deduped, cooldown-aware and priority-ranked;
 * insufficient evidence stays silent; dismissed conditions rest before resurfacing.
 */

const now = new Date("2026-09-04T12:00:00.000Z");

function signal(over: Partial<ProactiveSignalInput> = {}): ProactiveSignalInput {
  return {
    id: over.id ?? "s1",
    category: over.category ?? "opportunities",
    severity: over.severity ?? "medium",
    notify: over.notify ?? "important",
    priorityScore: over.priorityScore ?? 70,
    confidence: over.confidence ?? 0.8,
    headline: over.headline ?? "Focus window detected",
    reasons: over.reasons ?? ["Your 2 PM meeting was cancelled", "90-minute window opened"],
    implication: over.implication ?? "You have 90 uninterrupted minutes",
    dedupeKey: over.dedupeKey ?? "events:opportunities:focus-window-1400",
    action:
      "action" in over
        ? (over.action ?? null)
        : { kind: "focus", taskId: "t1", label: "Start Deep Work" },
    expiresAt: over.expiresAt ?? null,
  };
}

function ctx(over: Partial<ProactiveContext> = {}): ProactiveContext {
  return {
    now,
    enabled: over.enabled ?? true,
    signals: over.signals ?? [],
    workload: over.workload ?? null,
    decisions: over.decisions ?? { actionableCount: 0, oldestAgeMinutes: null },
    inbox: over.inbox ?? { unread: 0, oldestAgeMinutes: null },
    recentlyResolved: over.recentlyResolved ?? [],
    ...(over.cooldownMinutes !== undefined ? { cooldownMinutes: over.cooldownMinutes } : {}),
    ...(over.maxInterventions !== undefined ? { maxInterventions: over.maxInterventions } : {}),
  };
}

describe("enabled gate + silence on no evidence", () => {
  it("returns nothing when proactivity is disabled", () => {
    expect(evaluateProactive(ctx({ enabled: false, signals: [signal()] }))).toEqual([]);
  });
  it("stays silent when nothing crosses a threshold", () => {
    expect(evaluateProactive(ctx())).toEqual([]);
  });
});

describe("signal-derived interventions — thresholds + grounding", () => {
  it("surfaces a strong, confident, actionable signal with grounded reason", () => {
    const [i] = evaluateProactive(ctx({ signals: [signal()] }));
    expect(i).toBeDefined();
    expect(i!.kind).toBe("focus_window");
    expect(i!.action).toEqual({ kind: "focus", taskId: "t1", label: "Start Deep Work" });
    expect(i!.reason).toContain("uninterrupted");
    expect(i!.detail.length).toBeGreaterThan(0);
    expect(i!.dedupeKey).toBe("proactive:signal:events:opportunities:focus-window-1400");
  });
  it("ignores a weak-notify signal (only a suggestion)", () => {
    expect(evaluateProactive(ctx({ signals: [signal({ notify: "suggestion" })] }))).toEqual([]);
  });
  it("ignores a low-confidence signal (a weak guess)", () => {
    expect(evaluateProactive(ctx({ signals: [signal({ confidence: 0.3 })] }))).toEqual([]);
  });
  it("suppresses a non-critical signal with no executable action (no dead button)", () => {
    expect(evaluateProactive(ctx({ signals: [signal({ action: null })] }))).toEqual([]);
  });
  it("still surfaces a CRITICAL signal even without an action", () => {
    const [i] = evaluateProactive(ctx({ signals: [signal({ notify: "critical", action: null })] }));
    expect(i).toBeDefined();
    expect(i!.priority).toBe("critical");
    expect(i!.action).toBeNull();
  });
  it("classifies a deadline signal", () => {
    const [i] = evaluateProactive(
      ctx({
        signals: [
          signal({
            category: "risks",
            headline: "Task at risk — deadline approaching",
            action: { kind: "focus", taskId: "t9", label: "Start focus" },
          }),
        ],
      }),
    );
    expect(i!.kind).toBe("deadline_risk");
    expect(i!.category).toBe("warning");
  });
});

describe("overloaded day — from Stage 5 workload realism", () => {
  const overloaded: ProactiveWorkloadInput = {
    overloaded: true,
    overBy: 120,
    expectedMinutes: 420,
    realisticCapacityMinutes: 300,
    reasons: ["6 tasks planned", "2 meetings today"],
    headline: "Your day is overloaded",
    confidenceLevel: "high",
    deferSuggestions: [{ id: "t2", title: "Low priority task", estimateMinutes: 60 }],
  };
  it("surfaces when overloaded with something to move", () => {
    const [i] = evaluateProactive(ctx({ workload: overloaded }));
    expect(i!.kind).toBe("overloaded_day");
    expect(i!.reason).toContain("300m");
    expect(i!.action).toEqual({ kind: "navigate", href: "/planner", label: "Review plan" });
  });
  it("stays silent when overloaded but nothing can be moved", () => {
    expect(evaluateProactive(ctx({ workload: { ...overloaded, deferSuggestions: [] } }))).toEqual(
      [],
    );
  });
  it("stays silent when the day is realistic", () => {
    expect(evaluateProactive(ctx({ workload: { ...overloaded, overloaded: false } }))).toEqual([]);
  });
});

describe("stale decisions + inbox — deterministic thresholds", () => {
  it("surfaces decisions at/above the threshold", () => {
    const [i] = evaluateProactive(
      ctx({ decisions: { actionableCount: 3, oldestAgeMinutes: 180 } }),
    );
    expect(i!.kind).toBe("stale_decisions");
    expect(i!.reason).toContain("3 actionable");
  });
  it("stays silent below the decision threshold", () => {
    expect(
      evaluateProactive(ctx({ decisions: { actionableCount: 2, oldestAgeMinutes: 10 } })),
    ).toEqual([]);
  });
  it("surfaces inbox backlog at the hard threshold", () => {
    const [i] = evaluateProactive(ctx({ inbox: { unread: 10, oldestAgeMinutes: 30 } }));
    expect(i!.kind).toBe("inbox_backlog");
  });
  it("surfaces a smaller-but-aged inbox", () => {
    const [i] = evaluateProactive(ctx({ inbox: { unread: 6, oldestAgeMinutes: 2000 } }));
    expect(i!.kind).toBe("inbox_backlog");
  });
  it("stays silent for a small, fresh inbox", () => {
    expect(evaluateProactive(ctx({ inbox: { unread: 4, oldestAgeMinutes: 20 } }))).toEqual([]);
  });
});

describe("priority ranking + simultaneous cap", () => {
  it("orders highest score first and prefers few high-value over many", () => {
    const result = evaluateProactive(
      ctx({
        maxInterventions: 2,
        signals: [
          signal({ id: "a", notify: "critical", dedupeKey: "k-a" }),
          signal({ id: "b", notify: "important", dedupeKey: "k-b" }),
        ],
        inbox: { unread: 12, oldestAgeMinutes: 30 },
        decisions: { actionableCount: 4, oldestAgeMinutes: 60 },
      }),
    );
    expect(result.length).toBe(2);
    expect(result[0]!.priority).toBe("critical");
    // Deterministic: descending score.
    expect(result[0]!.score).toBeGreaterThanOrEqual(result[1]!.score);
  });
});

describe("cooldown — dismissal sticks, new condition re-triggers", () => {
  const resolved: ResolvedCondition[] = [
    {
      dedupeKey: "proactive:signal:events:opportunities:focus-window-1400",
      resolvedAt: "2026-09-04T11:00:00.000Z", // 1h ago
      status: "dismissed",
    },
  ];
  it("suppresses a just-dismissed condition", () => {
    expect(evaluateProactive(ctx({ signals: [signal()], recentlyResolved: resolved }))).toEqual([]);
  });
  it("lets a materially-changed condition (new dedupeKey) resurface immediately", () => {
    const [i] = evaluateProactive(
      ctx({
        signals: [signal({ dedupeKey: "events:opportunities:focus-window-1600" })],
        recentlyResolved: resolved,
      }),
    );
    expect(i).toBeDefined();
    expect(i!.kind).toBe("focus_window");
  });
  it("re-surfaces the same condition once the cooldown elapses", () => {
    const old: ResolvedCondition[] = [
      { ...resolved[0]!, resolvedAt: "2026-09-04T05:00:00.000Z" }, // 7h ago > 4h cooldown
    ];
    const [i] = evaluateProactive(ctx({ signals: [signal()], recentlyResolved: old }));
    expect(i).toBeDefined();
  });
  it("completed conditions rest longer than dismissed ones", () => {
    // 5h ago: past the 4h dismiss cooldown, but not the 8h completed cooldown.
    const at = "2026-09-04T07:00:00.000Z";
    const key = "proactive:x";
    expect(inCooldown(key, [{ dedupeKey: key, resolvedAt: at, status: "dismissed" }], now)).toBe(
      false,
    );
    expect(inCooldown(key, [{ dedupeKey: key, resolvedAt: at, status: "completed" }], now)).toBe(
      true,
    );
  });
  it("applyCooldown filters only matching keys", () => {
    const kept = applyCooldown(
      [
        {
          kind: "signal",
          category: "information",
          priority: "low",
          title: "x",
          reason: "x",
          detail: [],
          dedupeKey: "keep",
          action: null,
          confidence: 1,
          score: 10,
          ttlMinutes: 60,
        },
      ],
      [{ dedupeKey: "other", resolvedAt: now.toISOString(), status: "dismissed" }],
      now,
    );
    expect(kept.length).toBe(1);
  });
});

describe("determinism", () => {
  it("produces byte-identical output on re-run", () => {
    const input = ctx({
      signals: [signal(), signal({ id: "b", dedupeKey: "k2", notify: "critical" })],
      workload: {
        overloaded: true,
        overBy: 60,
        expectedMinutes: 300,
        realisticCapacityMinutes: 240,
        reasons: ["r"],
        headline: "Overloaded",
        confidenceLevel: "high",
        deferSuggestions: [{ id: "t", title: "T", estimateMinutes: 30 }],
      },
    });
    expect(evaluateProactive(input)).toEqual(evaluateProactive(input));
  });
});
