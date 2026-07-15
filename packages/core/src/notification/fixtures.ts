import { resolveEscalation } from "./priority";
import type { Notification, NotificationDraft } from "./types";

/**
 * Deterministic notification fixtures (Sprint 3.3). Fixed ids + timestamps — no
 * randomness, no `Date.now()`.
 */
export const FIXED_NOW = new Date("2026-07-11T14:00:00.000Z");

let counter = 0;
export function makeCounterId(prefix = "n"): () => string {
  return () => `${prefix}-${(counter += 1)}`;
}
export function resetCounter(): void {
  counter = 0;
}

export function makeDraft(overrides: Partial<NotificationDraft> = {}): NotificationDraft {
  return {
    type: "reminder",
    priority: "medium",
    title: "Take a break",
    reason: "You've been focused for a while.",
    source: "focus",
    dedupeKey: "focus:break-due",
    trigger: "focus.break_due",
    condition: "break-due",
    payload: {},
    sourceHref: "/focus",
    ...overrides,
  };
}

export function makeNotification(overrides: Partial<Notification> = {}): Notification {
  const base: Notification = {
    id: "notif-1",
    type: "reminder",
    priority: "medium",
    status: "generated",
    title: "Take a break",
    reason: "You've been focused for a while.",
    source: "focus",
    dedupeKey: "focus:break-due",
    trigger: "focus.break_due",
    condition: "break-due",
    payload: {},
    sourceHref: "/focus",
    createdAt: "2026-07-11T13:00:00.000Z",
    scheduledFor: null,
    deliveredAt: null,
    seenAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    completedAt: null,
    expiresAt: "2026-12-31T00:00:00.000Z",
    channels: [],
    escalation: resolveEscalation("medium", 0),
    updatedAt: "2026-07-11T13:00:00.000Z",
  };
  return { ...base, ...overrides };
}
