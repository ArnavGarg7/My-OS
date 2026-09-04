import { describe, expect, it, vi } from "vitest";
import type { Database } from "@myos/db";
import type { Notification } from "@myos/core/notification";
import type { ProactiveIntervention } from "@myos/core/proactive";

/**
 * Proactive server layer (Stage 6). The pure evaluator + cooldown are covered by the core
 * tests; here we verify the server MAPPING and READ seams: interventions ARE notifications
 * (source "proactive"), a focus action maps to the /focus surface, the notification-center
 * group filters to proactive only, and the Command Center picks the highest-priority one.
 */

vi.mock("server-only", () => ({}));

const store: { active: Notification[]; enabled: boolean } = { active: [], enabled: true };

vi.mock("../notification/repository", () => ({
  listActive: vi.fn(async () => store.active),
  listAll: vi.fn(async () => store.active),
}));
vi.mock("./repository", () => ({
  getEnabled: vi.fn(async () => store.enabled),
  setEnabled: vi.fn(async (_db: unknown, enabled: boolean) => enabled),
}));

import { interventionToDraft } from "./gather";
import * as service from "./service";

const db = {} as Database;

function notif(over: Partial<Notification>): Notification {
  return {
    id: "n1",
    type: "warning",
    priority: "high",
    status: "delivered",
    title: "t",
    reason: "r",
    source: "proactive",
    dedupeKey: "k",
    trigger: "proactive_evaluation",
    condition: "overloaded_day",
    payload: {},
    sourceHref: null,
    createdAt: "2026-09-04T10:00:00.000Z",
    scheduledFor: null,
    deliveredAt: null,
    seenAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    completedAt: null,
    expiresAt: null,
    channels: [],
    escalation: "banner",
    updatedAt: "2026-09-04T10:00:00.000Z",
    ...over,
  } as Notification;
}

describe("interventionToDraft — interventions ARE notifications", () => {
  const base: ProactiveIntervention = {
    kind: "focus_window",
    category: "focus",
    priority: "high",
    title: "Focus window detected",
    reason: "90 uninterrupted minutes",
    detail: ["Meeting cancelled"],
    dedupeKey: "proactive:signal:x",
    action: { kind: "focus", taskId: "t1", label: "Start Deep Work" },
    confidence: 0.8,
    score: 80,
    ttlMinutes: 120,
  };
  it("maps a focus intervention (source proactive, /focus href, action in payload)", () => {
    const d = interventionToDraft(base);
    expect(d.source).toBe("proactive");
    expect(d.type).toBe("focus");
    expect(d.priority).toBe("high");
    expect(d.dedupeKey).toBe("proactive:signal:x");
    expect(d.sourceHref).toBe("/focus");
    expect((d.payload as { action: unknown }).action).toEqual(base.action);
  });
  it("maps a navigate intervention to its href", () => {
    const d = interventionToDraft({
      ...base,
      kind: "overloaded_day",
      category: "warning",
      action: { kind: "navigate", href: "/planner", label: "Review plan" },
    });
    expect(d.type).toBe("warning");
    expect(d.sourceHref).toBe("/planner");
  });
  it("maps a no-action intervention to no href", () => {
    const d = interventionToDraft({ ...base, action: null });
    expect(d.sourceHref).toBeNull();
  });
});

describe("read seams — proactive subset + top intervention", () => {
  it("interventions() returns only source=proactive, newest first", async () => {
    store.active = [
      notif({ id: "a", source: "proactive", createdAt: "2026-09-04T09:00:00.000Z" }),
      notif({ id: "b", source: "planner", createdAt: "2026-09-04T11:00:00.000Z" }),
      notif({ id: "c", source: "proactive", createdAt: "2026-09-04T10:00:00.000Z" }),
    ];
    const out = await service.interventions(db);
    expect(out.map((i) => i.id)).toEqual(["c", "a"]);
  });
  it("forCommandCenter() picks the highest-priority proactive notification", async () => {
    store.enabled = true;
    store.active = [
      notif({ id: "low", source: "proactive", priority: "low" }),
      notif({ id: "crit", source: "proactive", priority: "critical" }),
      notif({ id: "sys", source: "health", priority: "critical" }),
    ];
    const { intervention, enabled } = await service.forCommandCenter(db);
    expect(enabled).toBe(true);
    expect(intervention?.id).toBe("crit");
  });
  it("forCommandCenter() returns null when nothing is proactive", async () => {
    store.active = [notif({ id: "sys", source: "health" })];
    const { intervention } = await service.forCommandCenter(db);
    expect(intervention).toBeNull();
  });
  it("parses action + detail out of the notification payload", async () => {
    store.active = [
      notif({
        id: "p",
        source: "proactive",
        payload: {
          action: { kind: "navigate", href: "/inbox", label: "Process inbox" },
          detail: ["12 items"],
          kind: "inbox_backlog",
          confidence: 0.9,
        },
      }),
    ];
    const [v] = await service.interventions(db);
    expect(v!.action).toEqual({ kind: "navigate", href: "/inbox", label: "Process inbox" });
    expect(v!.detail).toEqual(["12 items"]);
    expect(v!.kind).toBe("inbox_backlog");
  });
});
