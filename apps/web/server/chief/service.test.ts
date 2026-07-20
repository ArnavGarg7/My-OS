import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Chief service tests (Sprint 5.2). The composer's read-model modules and the repository are mocked
 * so the service can be exercised without a database — proving it composes context → Chief core →
 * persistence → telemetry and returns grounded, proposal-based results.
 */

vi.mock("../task/service", () => ({
  list: vi.fn(async () => [
    {
      id: "t1",
      title: "Ship Chief",
      status: "todo",
      estimatedMinutes: 120,
      dueAt: "2026-07-19T00:00:00.000Z",
    },
    { id: "t2", title: "Review PR", status: "todo", estimatedMinutes: 30, dueAt: null },
  ]),
}));
vi.mock("../calendar/service", () => ({ list: vi.fn(async () => []) }));
vi.mock("../goal/service", () => ({
  list: vi.fn(async () => [{ id: "g1", title: "Ship My OS", progress: 60 }]),
}));
vi.mock("../decision/service", () => ({ list: vi.fn(async () => []) }));
vi.mock("../health", () => ({
  healthSignals: vi.fn(async () => ({ readiness: 83, energy: "high" })),
}));
vi.mock("../focus", () => ({
  focusSignals: vi.fn(async () => ({ active: false, focusMinutesToday: 0 })),
}));

const persisted: unknown[] = [];
vi.mock("./repository", () => ({
  recordSession: vi.fn(async () => ({ sessionId: "s1", recommendationId: "r1" })),
  recordFeedback: vi.fn(async (_db, fb) => persisted.push(fb)),
  loadFeedback: vi.fn(async () => persisted),
  loadProfile: vi.fn(async () => null),
  saveProfile: vi.fn(async () => {}),
}));

import * as service from "./service";
import type { Database } from "@myos/db";

const db = {} as Database;

afterEach(() => {
  persisted.length = 0;
});

describe("chief.now", () => {
  it("returns a grounded recommendation with confidence + explanation, and persists", async () => {
    const r = await service.now(db, "Asia/Kolkata", "Arnav");
    expect(r.recommendation.action).toBe("start_focus");
    expect(r.recommendation.explanation.situation.length).toBeGreaterThan(0);
    expect(r.recommendation.confidence).toBeDefined();
    expect(r.provider.provider).toBe("local");
    expect(r.recommendationId).toBe("r1");
    expect(r.context.readiness).toBe(83);
  });
});

describe("chief.morning", () => {
  it("assembles morning intelligence", async () => {
    const m = await service.morning(db, "Asia/Kolkata", "Arnav");
    expect(m.morning.greeting).toContain("Arnav");
    expect(m.morning.mission.length).toBeGreaterThan(0);
    expect(m.provider.provider).toBe("local");
  });
});

describe("chief.optimize / rescue / night — proposals only", () => {
  it("optimize returns a proposal", async () => {
    expect((await service.optimize(db, "Asia/Kolkata", "Arnav")).kind).toBe("optimize");
  });
  it("rescue reshuffles around disruptions", async () => {
    const p = await service.rescue(db, "Asia/Kolkata", "Arnav", [
      { kind: "cancelled_event", detail: "meeting", minutes: 60 },
    ]);
    expect(p.kind).toBe("rescue");
    expect(p.changes.length).toBeGreaterThan(0);
  });
  it("night carries work forward into a tomorrow proposal", async () => {
    const n = await service.night(db, "Asia/Kolkata", "Arnav");
    expect(n.proposal.kind).toBe("night");
    expect(n.review.carryForward.length).toBeGreaterThan(0);
  });
});

describe("chief.feedback", () => {
  it("records feedback and returns an updated summary", async () => {
    const res = await service.feedback(db, {
      recommendationId: "r1",
      outcome: "accepted",
      note: "start later",
    });
    expect(res.summary.accepted).toBe(1);
    expect(res.profile.revision).toBe(1);
  });
});
