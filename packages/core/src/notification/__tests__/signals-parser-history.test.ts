import { describe, expect, it } from "vitest";
import { computeSignals } from "../signals";
import { isReminderWindow, parseReminderWindow, reminderToDeliverAt } from "../parser";
import { recordTransition, responseTimeMs } from "../history";
import { defaultPreferences } from "../preferences";
import { makeNotification } from "../fixtures";

const now = new Date("2026-07-11T14:00:00Z");

describe("signals", () => {
  it("counts unread + queued", () => {
    const list = [
      makeNotification({ id: "a", status: "delivered" }),
      makeNotification({ id: "b", status: "snoozed", snoozedUntil: "2026-07-11T18:00:00Z" }),
    ];
    const s = computeSignals({
      notifications: list,
      prefs: defaultPreferences(),
      now,
      timezone: "UTC",
    });
    expect(s.unread).toBe(1);
    expect(s.queued).toBe(1);
  });

  it("flags critical overdue", () => {
    const list = [
      makeNotification({
        priority: "critical",
        status: "delivered",
        expiresAt: "2020-01-01T00:00:00Z",
      }),
    ];
    expect(
      computeSignals({ notifications: list, prefs: defaultPreferences(), now, timezone: "UTC" })
        .criticalOverdue,
    ).toBe(true);
  });

  it("flags too many ignored", () => {
    const list = Array.from({ length: 15 }, (_, i) =>
      makeNotification({ id: `n${i}`, status: "delivered" }),
    );
    expect(
      computeSignals({ notifications: list, prefs: defaultPreferences(), now, timezone: "UTC" })
        .tooManyIgnored,
    ).toBe(true);
  });

  it("flags repeated snoozes", () => {
    const list = [makeNotification({ status: "snoozed", snoozeCount: 3 })];
    expect(
      computeSignals({ notifications: list, prefs: defaultPreferences(), now, timezone: "UTC" })
        .repeatedSnoozes,
    ).toBe(true);
  });

  it("reflects muted + quiet hours", () => {
    const prefs = { ...defaultPreferences(), muted: true };
    const night = new Date("2026-07-11T23:00:00Z");
    const s = computeSignals({ notifications: [], prefs, now: night, timezone: "UTC" });
    expect(s.muted).toBe(true);
    expect(s.inQuietHours).toBe(true);
  });
});

describe("parser", () => {
  it("parses fixed windows", () => {
    expect(parseReminderWindow("10m")).toEqual({ window: "10m", minutes: 10 });
    expect(parseReminderWindow("1h")).toEqual({ window: "1h", minutes: 60 });
    expect(parseReminderWindow("now")).toEqual({ window: "immediately", minutes: 0 });
  });

  it("parses tomorrow with null minutes", () => {
    expect(parseReminderWindow("tomorrow")).toEqual({ window: "tomorrow", minutes: null });
  });

  it("falls back to immediately on unknown", () => {
    expect(parseReminderWindow("whenever").window).toBe("immediately");
  });

  it("reminderToDeliverAt resolves fixed windows", () => {
    expect(reminderToDeliverAt("30m", now)).toBe("2026-07-11T14:30:00.000Z");
  });

  it("reminderToDeliverAt resolves custom minutes", () => {
    expect(reminderToDeliverAt("custom", now, 90)).toBe("2026-07-11T15:30:00.000Z");
  });

  it("reminderToDeliverAt uses the tomorrow resolver", () => {
    expect(reminderToDeliverAt("tomorrow", now, undefined, () => "2026-07-12T09:00:00.000Z")).toBe(
      "2026-07-12T09:00:00.000Z",
    );
  });

  it("isReminderWindow validates", () => {
    expect(isReminderWindow("15m")).toBe(true);
    expect(isReminderWindow("nope")).toBe(false);
  });
});

describe("history", () => {
  it("records a transition entry", () => {
    const entry = recordTransition("h1", "n1", "delivered", now, "sent");
    expect(entry).toEqual({
      id: "h1",
      notificationId: "n1",
      status: "delivered",
      at: now.toISOString(),
      note: "sent",
    });
  });

  it("computes response time", () => {
    expect(responseTimeMs("2026-07-11T14:00:00Z", "2026-07-11T14:05:00Z")).toBe(300_000);
    expect(responseTimeMs(null, "2026-07-11T14:05:00Z")).toBeNull();
  });
});
