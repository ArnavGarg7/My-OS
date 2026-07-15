import { beforeEach, describe, expect, it } from "vitest";
import {
  ACTIVE_STATUSES,
  DELIVERY_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  PRIORITY_RANK,
  REMINDER_WINDOW_MINUTES,
  TERMINAL_STATUSES,
  escalationForPriority,
} from "../constants";
import { createNotificationEngine, isTerminalStatus } from "../engine";
import { generateDrafts } from "../rules";
import { schedule } from "../scheduler";
import { decideDelivery } from "../delivery";
import { defaultPreferences } from "../preferences";
import { selectActive } from "../selectors";
import { makeCounterId, resetCounter } from "../fixtures";

describe("constants", () => {
  it("defines all 13 notification types", () => {
    expect(NOTIFICATION_TYPES).toHaveLength(13);
  });

  it("defines 5 priorities with a rank ordering", () => {
    expect(NOTIFICATION_PRIORITIES).toHaveLength(5);
    expect(PRIORITY_RANK.critical).toBeGreaterThan(PRIORITY_RANK.high);
    expect(PRIORITY_RANK.silent).toBe(0);
  });

  it("defines 10 statuses split into active + terminal", () => {
    expect(NOTIFICATION_STATUSES).toHaveLength(10);
    for (const s of ACTIVE_STATUSES) expect(TERMINAL_STATUSES).not.toContain(s);
  });

  it("defines 7 delivery channels", () => {
    expect(DELIVERY_CHANNELS).toHaveLength(7);
  });

  it("reminder window minutes are monotonic", () => {
    expect(REMINDER_WINDOW_MINUTES["5m"]).toBe(5);
    expect(REMINDER_WINDOW_MINUTES["1h"]).toBe(60);
    expect(REMINDER_WINDOW_MINUTES.immediately).toBe(0);
  });

  it("escalationForPriority covers every priority", () => {
    for (const p of NOTIFICATION_PRIORITIES) {
      expect(typeof escalationForPriority(p)).toBe("string");
    }
  });

  it("isTerminalStatus matches the terminal set", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("delivered")).toBe(false);
  });
});

describe("end-to-end signal → notification flow", () => {
  beforeEach(() => resetCounter());

  it("turns a planner signal into a delivered notification", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T12:00:00Z"),
    );
    const drafts = generateDrafts({
      now: new Date("2026-07-15T12:00:00Z"),
      planner: { blockStartingTitle: "Write report", blockStartingInMinutes: 5 },
    });
    expect(drafts).toHaveLength(1);

    const { created } = engine.reconcile(drafts, []);
    let n = created[0]!;
    expect(n.status).toBe("generated");

    const decision = schedule(n, {
      now: new Date("2026-07-15T12:00:00Z"),
      timezone: "UTC",
      prefs: defaultPreferences(),
    });
    expect(decision.action).toBe("deliver_now");

    n = engine.markScheduled(n, decision.deliverAt);
    const delivery = decideDelivery(n, defaultPreferences());
    n = engine.markDelivered(n, delivery);
    expect(n.status).toBe("delivered");
    expect(n.channels.length).toBeGreaterThan(0);
    expect(selectActive([n])).toHaveLength(1);
  });

  it("a second identical signal does not create a duplicate", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T12:00:00Z"),
    );
    const ctx = {
      now: new Date("2026-07-15T12:00:00Z"),
      health: { waterOverdue: true },
    };
    const first = engine.reconcile(generateDrafts(ctx), []);
    const delivered = engine.markDelivered(
      first.created[0]!,
      decideDelivery(first.created[0]!, defaultPreferences()),
    );
    const second = engine.reconcile(generateDrafts(ctx), [delivered]);
    expect(second.created).toHaveLength(0);
    expect(second.refreshed).toHaveLength(1);
  });

  it("a critical notification bypasses mute + quiet hours", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T23:00:00Z"),
    );
    const n = engine.create({
      type: "system",
      priority: "critical",
      title: "Critical",
      reason: "urgent",
      source: "system",
      dedupeKey: "system:critical",
      trigger: "system.critical",
      condition: "critical",
    });
    const decision = schedule(n, {
      now: new Date("2026-07-15T23:00:00Z"),
      timezone: "UTC",
      prefs: { ...defaultPreferences(), muted: true },
    });
    expect(decision.action).toBe("deliver_now");
  });

  it("a low-priority notification is suppressed in quiet hours", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T23:00:00Z"),
    );
    const n = engine.create({
      type: "health",
      priority: "low",
      title: "Hydrate",
      reason: "water",
      source: "health",
      dedupeKey: "health:water",
      trigger: "health.water",
      condition: "water",
      expiresAt: "2026-07-16T23:00:00Z",
    });
    const decision = schedule(n, {
      now: new Date("2026-07-15T23:00:00Z"),
      timezone: "UTC",
      prefs: defaultPreferences(),
    });
    expect(decision.action).toBe("suppress");
  });

  it("reconcile with no drafts yields nothing", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T12:00:00Z"),
    );
    const { created, refreshed } = engine.reconcile([], []);
    expect(created).toHaveLength(0);
    expect(refreshed).toHaveLength(0);
  });

  it("snoozing past the limit stops re-delivery", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T12:00:00Z"),
    );
    let n = engine.create({
      type: "reminder",
      priority: "medium",
      title: "t",
      reason: "r",
      source: "s",
      dedupeKey: "s:c",
      trigger: "s.c",
      condition: "c",
    });
    for (let i = 0; i < 5; i++) n = engine.snooze(n, 10);
    expect(n.snoozeCount).toBe(5);
    const d = schedule(n, {
      now: new Date("2026-07-16T11:00:00Z"),
      timezone: "UTC",
      prefs: defaultPreferences(),
    });
    // snoozedUntil is in the past now → not queued; snooze limit → suppress
    expect(d.action).toBe("suppress");
  });

  it("payload carries automation trigger + condition + source", () => {
    const drafts = generateDrafts({
      now: new Date("2026-07-15T12:00:00Z"),
      finance: { budgetExceededCategory: "Dining" },
    });
    const d = drafts[0]!;
    expect(d.trigger).toBe("finance.budget_exceeded");
    expect(d.condition).toContain("budget");
    expect(d.source).toBe("finance");
    expect(d.payload).toMatchObject({ category: "Dining" });
  });

  it("archive requires a prior resolution but does not throw on resolved", () => {
    const engine = createNotificationEngine(
      makeCounterId(),
      () => new Date("2026-07-15T12:00:00Z"),
    );
    const n = engine.create({
      type: "reminder",
      priority: "low",
      title: "t",
      reason: "r",
      source: "s",
      dedupeKey: "s:c",
      trigger: "s.c",
      condition: "c",
    });
    expect(engine.archive(engine.dismiss(n)).status).toBe("archived");
  });
});
