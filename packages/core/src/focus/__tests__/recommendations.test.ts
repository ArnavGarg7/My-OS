import { describe, expect, it } from "vitest";
import { buildRecommendations } from "../recommendations";
import { buildReadiness } from "../readiness";
import { makeInterruptionFixture, makeSession } from "../fixtures";

const NOW = new Date("2026-07-11T12:00:00Z");

describe("focus recommendations", () => {
  it("suggests starting a session when idle and ready", () => {
    const recs = buildRecommendations(
      null,
      NOW,
      buildReadiness({ score: 90, hydrationPercent: 80, recovery: "high", sleepMinutes: 450 }),
    );
    expect(recs[0]?.id).toBe("start-focus");
  });

  it("suggests starting light when idle and low readiness", () => {
    const recs = buildRecommendations(
      null,
      NOW,
      buildReadiness({ score: 30, hydrationPercent: 80, recovery: "low", sleepMinutes: 200 }),
    );
    expect(recs[0]?.id).toBe("start-light");
    expect(recs[0]?.tone).toBe("warning");
  });

  it("recommends a break after a long session", () => {
    const s = makeSession({
      status: "running",
      startedAt: "2026-07-11T10:20:00Z",
      plannedMinutes: 50,
    });
    const recs = buildRecommendations(s, NOW, null);
    expect(recs.some((r) => r.id === "break")).toBe(true);
  });

  it("recommends silencing distractions on high interruptions", () => {
    const s = makeSession({
      status: "running",
      startedAt: "2026-07-11T11:50:00Z",
      interruptions: [1, 2, 3, 4].map((n) => makeInterruptionFixture({ id: `i${n}` })),
    });
    const recs = buildRecommendations(s, NOW, null);
    expect(recs.some((r) => r.id === "reduce-interruptions")).toBe(true);
  });

  it("recommends hydrating when hydration is low", () => {
    const s = makeSession({ status: "running", startedAt: "2026-07-11T11:50:00Z" });
    const recs = buildRecommendations(
      s,
      NOW,
      buildReadiness({ score: 80, hydrationPercent: 20, recovery: "high", sleepMinutes: 450 }),
    );
    expect(recs.some((r) => r.id === "hydrate")).toBe(true);
  });

  it("returns an in-flow message when nothing is wrong", () => {
    const s = makeSession({
      status: "running",
      startedAt: "2026-07-11T11:55:00Z",
      plannedMinutes: 50,
    });
    const recs = buildRecommendations(
      s,
      NOW,
      buildReadiness({ score: 80, hydrationPercent: 80, recovery: "high", sleepMinutes: 450 }),
    );
    expect(recs.some((r) => r.id === "in-flow")).toBe(true);
  });

  it("flags wrap-up when overrunning", () => {
    const s = makeSession({
      status: "running",
      startedAt: "2026-07-11T10:00:00Z",
      plannedMinutes: 50,
    });
    const recs = buildRecommendations(s, NOW, null); // 120 min focus
    expect(recs.some((r) => r.id === "wrap-up")).toBe(true);
  });
});
