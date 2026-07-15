import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPreferences, makeNotification } from "@myos/core/notification";

// NotificationService is server-only; mock the repository + signal gatherer.
const h = vi.hoisted(() => ({
  listAll: vi.fn(),
  listActive: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  enqueue: vi.fn(),
  dequeue: vi.fn(),
  queueCount: vi.fn(),
  getPreferences: vi.fn(),
  savePreferences: vi.fn(),
  recordHistory: vi.fn(),
  listHistory: vi.fn(),
  bulkSetStatus: vi.fn(),
  gatherRuleContext: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("./signals", () => ({ gatherRuleContext: h.gatherRuleContext }));

import * as service from "./service";

const db = {} as never;
const TZ = "UTC";
const NOW = new Date("2026-07-15T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  h.listActive.mockResolvedValue([]);
  h.listAll.mockResolvedValue([]);
  h.listHistory.mockResolvedValue([]);
  h.queueCount.mockResolvedValue(0);
  h.getPreferences.mockResolvedValue(defaultPreferences());
  h.savePreferences.mockImplementation((_db, p) => Promise.resolve(p));
  h.insert.mockImplementation((_db, n) => Promise.resolve(n));
  h.update.mockImplementation((_db, n) => Promise.resolve(n));
  h.recordHistory.mockResolvedValue(undefined);
  h.enqueue.mockResolvedValue(undefined);
  h.dequeue.mockResolvedValue(undefined);
  h.gatherRuleContext.mockResolvedValue({ now: NOW });
});

describe("generate", () => {
  it("creates + delivers a notification from a signal", async () => {
    h.gatherRuleContext.mockResolvedValue({ now: NOW, health: { waterOverdue: true } });
    h.getById.mockImplementation((_db, id) =>
      Promise.resolve(
        makeNotification({ id, status: "scheduled", type: "health", priority: "low" }),
      ),
    );
    const result = await service.generate(db, TZ, NOW);
    expect(result.created).toBe(1);
    expect(h.insert).toHaveBeenCalledOnce();
    expect(h.recordHistory).toHaveBeenCalled();
  });

  it("does not create duplicates against an existing active notification", async () => {
    h.listActive.mockResolvedValue([
      makeNotification({ dedupeKey: "health:water-overdue", status: "delivered" }),
    ]);
    h.gatherRuleContext.mockResolvedValue({ now: NOW, health: { waterOverdue: true } });
    const result = await service.generate(db, TZ, NOW);
    expect(result.created).toBe(0);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("suppresses a low-priority notification during quiet hours", async () => {
    h.getPreferences.mockResolvedValue({
      ...defaultPreferences(),
      quietHours: { enabled: true, start: "00:00", end: "23:59" },
    });
    h.gatherRuleContext.mockResolvedValue({ now: NOW, health: { waterOverdue: true } });
    h.getById.mockImplementation((_db, id) =>
      Promise.resolve(
        makeNotification({ id, status: "scheduled", type: "health", priority: "low" }),
      ),
    );
    const result = await service.generate(db, TZ, NOW);
    expect(result.suppressed).toBeGreaterThanOrEqual(1);
  });

  it("returns zero when no signals match", async () => {
    const result = await service.generate(db, TZ, NOW);
    expect(result).toEqual({ created: 0, delivered: 0, suppressed: 0 });
  });
});

describe("lifecycle mutations", () => {
  beforeEach(() => {
    h.getById.mockResolvedValue(makeNotification({ status: "delivered" }));
  });

  it("dismiss sets dismissed + dequeues", async () => {
    const n = await service.dismiss(db, "notif-1");
    expect(n.status).toBe("dismissed");
    expect(h.dequeue).toHaveBeenCalledWith(db, "notif-1");
  });

  it("complete sets completed", async () => {
    expect((await service.complete(db, "notif-1")).status).toBe("completed");
  });

  it("markSeen only transitions from delivered", async () => {
    expect((await service.markSeen(db, "notif-1")).status).toBe("seen");
    h.getById.mockResolvedValue(makeNotification({ status: "seen" }));
    expect((await service.markSeen(db, "notif-1")).status).toBe("seen");
  });

  it("snooze sets snoozed + enqueues", async () => {
    const n = await service.snooze(db, "notif-1", undefined, 30, NOW);
    expect(n.status).toBe("snoozed");
    expect(n.snoozeCount).toBe(1);
    expect(h.enqueue).toHaveBeenCalled();
  });

  it("snooze resolves a reminder window to ~60 min ahead", async () => {
    const before = Date.now();
    const n = await service.snooze(db, "notif-1", "1h", undefined, new Date());
    const delta = Date.parse(n.snoozedUntil!) - before;
    expect(delta).toBeGreaterThan(59 * 60_000);
    expect(delta).toBeLessThan(61 * 60_000);
  });

  it("schedule sets a future deliver time + enqueues", async () => {
    const n = await service.schedule(db, "notif-1", "30m", undefined, NOW);
    expect(n.scheduledFor).toBe("2026-07-15T12:30:00.000Z");
    expect(h.enqueue).toHaveBeenCalled();
  });

  it("throws when notification not found", async () => {
    h.getById.mockResolvedValue(null);
    await expect(service.dismiss(db, "missing")).rejects.toThrow();
  });
});

describe("preferences", () => {
  it("updates global mute", async () => {
    const prefs = await service.updatePreferences(db, { muted: true });
    expect(prefs.muted).toBe(true);
  });

  it("updates quiet hours", async () => {
    const prefs = await service.updatePreferences(db, {
      quietHours: { enabled: true, start: "23:00", end: "06:00" },
    });
    expect(prefs.quietHours.start).toBe("23:00");
  });

  it("updates a category preference", async () => {
    const prefs = await service.updatePreferences(db, {
      category: { type: "calendar", push: false },
    });
    expect(prefs.categories.find((c) => c.type === "calendar")?.push).toBe(false);
  });
});

describe("reads", () => {
  it("count aggregates unread/queued/active", async () => {
    h.listActive.mockResolvedValue([makeNotification({ status: "delivered" })]);
    h.queueCount.mockResolvedValue(3);
    const c = await service.count(db, TZ, NOW);
    expect(c.unread).toBe(1);
    expect(c.queued).toBe(3);
    expect(c.active).toBe(1);
  });

  it("summary reports top priority", async () => {
    h.listActive.mockResolvedValue([makeNotification({ status: "delivered", priority: "high" })]);
    const s = await service.summary(db, TZ, NOW);
    expect(s.topPriority).toBe("high");
    expect(s.unread).toBe(1);
  });

  it("dismissAll bulk-sets and returns the count", async () => {
    h.listActive.mockResolvedValue([makeNotification({ id: "a" }), makeNotification({ id: "b" })]);
    expect(await service.dismissAll(db)).toBe(2);
    expect(h.bulkSetStatus).toHaveBeenCalledWith(db, ["a", "b"], "dismissed");
  });

  it("markAllRead only marks delivered", async () => {
    h.listActive.mockResolvedValue([
      makeNotification({ id: "a", status: "delivered" }),
      makeNotification({ id: "b", status: "seen" }),
    ]);
    expect(await service.markAllRead(db)).toBe(1);
  });

  it("history + list delegate to the repository", async () => {
    await service.history(db, 10);
    expect(h.listHistory).toHaveBeenCalledWith(db, 10);
    await service.list(db, 5);
    expect(h.listAll).toHaveBeenCalledWith(db, 5);
  });
});
