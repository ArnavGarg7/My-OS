import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  historyRowToEntry,
  notificationToColumns,
  preferencesToColumns,
  rowToNotification,
  rowToPreferences,
} from "./mapper";
import { defaultPreferences, makeNotification } from "@myos/core/notification";
import type {
  NotificationHistoryRow,
  NotificationPreferencesRow,
  NotificationRow,
} from "@myos/db/schema";

const row: NotificationRow = {
  id: "n1",
  type: "reminder",
  priority: "high",
  status: "delivered",
  title: "Meeting soon",
  reason: "Standup in 5 min",
  source: "calendar",
  dedupeKey: "calendar:meeting-soon",
  trigger: "calendar.meeting_soon",
  condition: "meeting-soon",
  payload: { minutes: 5 },
  sourceHref: "/calendar",
  scheduledFor: new Date("2026-07-15T12:00:00Z"),
  deliveredAt: new Date("2026-07-15T12:01:00Z"),
  seenAt: null,
  snoozedUntil: null,
  snoozeCount: 0,
  completedAt: null,
  expiresAt: new Date("2026-07-16T12:00:00Z"),
  channels: ["banner", "desktop"],
  escalation: "persistent",
  createdAt: new Date("2026-07-15T11:59:00Z"),
  updatedAt: new Date("2026-07-15T12:01:00Z"),
};

describe("notification mappers", () => {
  it("maps a row to the domain notification", () => {
    const n = rowToNotification(row);
    expect(n.id).toBe("n1");
    expect(n.priority).toBe("high");
    expect(n.channels).toEqual(["banner", "desktop"]);
    expect(n.payload).toEqual({ minutes: 5 });
    expect(n.deliveredAt).toBe("2026-07-15T12:01:00.000Z");
    expect(n.seenAt).toBeNull();
  });

  it("maps a domain notification back to columns", () => {
    const cols = notificationToColumns(makeNotification({ title: "x" }));
    expect(cols.title).toBe("x");
    expect(cols.expiresAt).toBeInstanceOf(Date);
    expect(cols.updatedAt).toBeInstanceOf(Date);
  });

  it("round-trips a notification through columns", () => {
    const domain = rowToNotification(row);
    const cols = notificationToColumns(domain);
    expect(cols.dedupeKey).toBe("calendar:meeting-soon");
    expect(cols.snoozeCount).toBe(0);
  });

  it("falls back to default preferences when no row", () => {
    expect(rowToPreferences(undefined)).toEqual(defaultPreferences());
  });

  it("maps a preferences row", () => {
    const prow: NotificationPreferencesRow = {
      id: "p1",
      quietHoursEnabled: true,
      quietHoursStart: "23:00",
      quietHoursEnd: "06:00",
      workingHoursOnly: true,
      weekendSuppression: false,
      muted: true,
      categories: [],
      updatedAt: new Date(),
    };
    const prefs = rowToPreferences(prow);
    expect(prefs.quietHours.start).toBe("23:00");
    expect(prefs.muted).toBe(true);
    expect(prefs.categories.length).toBeGreaterThan(0); // filled from defaults
  });

  it("maps preferences to columns", () => {
    const cols = preferencesToColumns(defaultPreferences());
    expect(cols.quietHoursStart).toBe("22:00");
    expect(Array.isArray(cols.categories)).toBe(true);
  });

  it("maps a history row", () => {
    const hrow: NotificationHistoryRow = {
      id: "h1",
      notificationId: "n1",
      status: "delivered",
      note: "banner",
      at: new Date("2026-07-15T12:01:00Z"),
    };
    const entry = historyRowToEntry(hrow);
    expect(entry.status).toBe("delivered");
    expect(entry.note).toBe("banner");
  });
});
