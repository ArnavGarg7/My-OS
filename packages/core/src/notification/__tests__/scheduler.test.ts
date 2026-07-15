import { describe, expect, it } from "vitest";
import { schedule, tomorrowAt } from "../scheduler";
import { defaultPreferences } from "../preferences";
import { makeNotification } from "../fixtures";
import type { NotificationPreferences } from "../types";

const TZ = "UTC";
function prefs(over: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return { ...defaultPreferences(), ...over };
}

describe("scheduler", () => {
  const day = new Date("2026-07-15T12:00:00Z"); // Wednesday noon

  it("delivers now when ready", () => {
    const d = schedule(makeNotification({ priority: "medium" }), {
      now: day,
      timezone: TZ,
      prefs: prefs(),
    });
    expect(d.action).toBe("deliver_now");
  });

  it("expires when past expiry", () => {
    const n = makeNotification({ expiresAt: "2020-01-01T00:00:00Z" });
    expect(schedule(n, { now: day, timezone: TZ, prefs: prefs() }).action).toBe("expire");
  });

  it("queues a future scheduledFor", () => {
    const n = makeNotification({ scheduledFor: "2026-07-15T18:00:00Z" });
    const d = schedule(n, { now: day, timezone: TZ, prefs: prefs() });
    expect(d.action).toBe("queue");
    expect(d.deliverAt).toBe("2026-07-15T18:00:00Z");
  });

  it("queues while snoozed", () => {
    const n = makeNotification({ snoozedUntil: "2026-07-15T13:00:00Z" });
    expect(schedule(n, { now: day, timezone: TZ, prefs: prefs() }).action).toBe("queue");
  });

  it("suppresses non-critical when muted", () => {
    const n = makeNotification({ priority: "high" });
    expect(schedule(n, { now: day, timezone: TZ, prefs: prefs({ muted: true }) }).action).toBe(
      "suppress",
    );
  });

  it("still delivers critical when muted", () => {
    const n = makeNotification({ priority: "critical" });
    expect(schedule(n, { now: day, timezone: TZ, prefs: prefs({ muted: true }) }).action).toBe(
      "deliver_now",
    );
  });

  it("delays high priority past quiet hours", () => {
    const night = new Date("2026-07-15T23:00:00Z");
    const n = makeNotification({ priority: "high", expiresAt: "2026-07-16T23:00:00Z" });
    const d = schedule(n, { now: night, timezone: TZ, prefs: prefs() });
    expect(d.action).toBe("delay");
    expect(d.deliverAt).toBe("2026-07-16T07:00:00.000Z");
  });

  it("suppresses low priority during quiet hours", () => {
    const night = new Date("2026-07-15T23:00:00Z");
    const n = makeNotification({ priority: "low", expiresAt: "2026-07-16T23:00:00Z" });
    expect(schedule(n, { now: night, timezone: TZ, prefs: prefs() }).action).toBe("suppress");
  });

  it("delivers critical during quiet hours", () => {
    const night = new Date("2026-07-15T23:00:00Z");
    const n = makeNotification({ priority: "critical", expiresAt: "2026-07-16T23:00:00Z" });
    expect(schedule(n, { now: night, timezone: TZ, prefs: prefs() }).action).toBe("deliver_now");
  });

  it("suppresses non-critical on weekends when configured", () => {
    const saturday = new Date("2026-07-18T12:00:00Z");
    const n = makeNotification({ priority: "medium" });
    expect(
      schedule(n, { now: saturday, timezone: TZ, prefs: prefs({ weekendSuppression: true }) })
        .action,
    ).toBe("suppress");
  });

  it("suppresses after snooze limit", () => {
    const n = makeNotification({ priority: "medium", snoozeCount: 5 });
    expect(schedule(n, { now: day, timezone: TZ, prefs: prefs() }).action).toBe("suppress");
  });

  it("tomorrowAt returns next-day morning ISO", () => {
    const iso = tomorrowAt(new Date("2026-07-15T12:00:00Z"));
    expect(iso).toBe("2026-07-16T09:00:00.000Z");
  });
});
