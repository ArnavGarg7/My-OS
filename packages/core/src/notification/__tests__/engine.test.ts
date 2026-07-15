import { beforeEach, describe, expect, it } from "vitest";
import {
  NotificationTransitionError,
  createNotificationEngine,
  type NotificationEngine,
} from "../engine";
import { defaultPreferences } from "../preferences";
import { makeCounterId, makeDraft, makeNotification, resetCounter } from "../fixtures";

function engineAt(iso: string): NotificationEngine {
  return createNotificationEngine(makeCounterId("n"), () => new Date(iso));
}

describe("NotificationEngine", () => {
  beforeEach(() => resetCounter());

  it("creates a generated notification with an expiry", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    const n = e.create(makeDraft({ ttlMinutes: 60 }));
    expect(n.status).toBe("generated");
    expect(n.id).toBe("n-1");
    expect(n.expiresAt).toBe("2026-07-11T15:00:00.000Z");
    expect(n.escalation).toBe("banner"); // medium
  });

  it("reconcile creates new and refreshes duplicates", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    const existing = [makeNotification({ dedupeKey: "focus:break-due", status: "delivered" })];
    const { created, refreshed } = e.reconcile(
      [
        makeDraft({ dedupeKey: "focus:break-due", title: "again" }),
        makeDraft({ dedupeKey: "health:water-overdue", source: "health" }),
      ],
      existing,
    );
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0]?.title).toBe("again");
    expect(created).toHaveLength(1);
    expect(created[0]?.dedupeKey).toBe("health:water-overdue");
  });

  it("collapses two identical drafts in one batch", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    const { created } = e.reconcile(
      [makeDraft({ dedupeKey: "a:b" }), makeDraft({ dedupeKey: "a:b" })],
      [],
    );
    expect(created).toHaveLength(1);
  });

  it("advances the lifecycle generated→scheduled→delivered→seen→completed", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    let n = e.create(makeDraft());
    n = e.markScheduled(n, "2026-07-11T14:05:00.000Z");
    expect(n.status).toBe("scheduled");
    n = e.markDelivered(n, e.decideDelivery(n, defaultPreferences()));
    expect(n.status).toBe("delivered");
    expect(n.deliveredAt).not.toBeNull();
    n = e.markSeen(n);
    expect(n.status).toBe("seen");
    n = e.complete(n);
    expect(n.status).toBe("completed");
    expect(n.completedAt).not.toBeNull();
  });

  it("snooze bumps count, sets snoozedUntil and escalates high priority", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    let n = e.create(makeDraft({ priority: "high" }));
    n = e.snooze(n, 30);
    expect(n.status).toBe("snoozed");
    expect(n.snoozeCount).toBe(1);
    expect(n.snoozedUntil).toBe("2026-07-11T14:30:00.000Z");
    n = e.snooze(n, 15);
    expect(n.snoozeCount).toBe(2);
    expect(n.escalation).toBe("critical"); // high + 2 snoozes
  });

  it("dismiss/cancel/expire/archive set terminal statuses", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    expect(e.dismiss(e.create(makeDraft())).status).toBe("dismissed");
    expect(e.cancel(e.create(makeDraft())).status).toBe("cancelled");
    expect(e.expire(e.create(makeDraft())).status).toBe("expired");
    expect(e.archive(e.complete(e.create(makeDraft()))).status).toBe("archived");
  });

  it("throws on transitions from a terminal status", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    const done = e.complete(e.create(makeDraft()));
    expect(() => e.markSeen(done)).toThrow(NotificationTransitionError);
    expect(() => e.snooze(done)).toThrow();
  });

  it("computes summary + signals through the engine", () => {
    const e = engineAt("2026-07-11T14:00:00Z");
    const list = [
      makeNotification({ status: "delivered", priority: "high" }),
      makeNotification({ id: "n2", status: "completed" }),
    ];
    const summary = e.summary(list, false, false);
    expect(summary.unread).toBe(1);
    expect(summary.topPriority).toBe("high");
    const signals = e.signals(list, defaultPreferences(), "UTC");
    expect(signals.unread).toBe(1);
  });
});
