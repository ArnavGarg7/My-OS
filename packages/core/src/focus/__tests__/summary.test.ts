import { describe, expect, it } from "vitest";
import { buildDailySnapshot, buildSummary } from "../summary";
import { completedSession, makeInterruptionFixture, makeSession } from "../fixtures";

const NOW = new Date("2026-07-11T12:00:00Z");

describe("focus summary", () => {
  it("summarises an idle day", () => {
    const s = buildSummary(null, [], NOW);
    expect(s.active).toBe(false);
    expect(s.status).toBe("idle");
    expect(s.focusMinutesToday).toBe(0);
  });

  it("reports remaining minutes for an active session", () => {
    const active = makeSession({
      status: "running",
      startedAt: "2026-07-11T11:30:00Z",
      plannedMinutes: 50,
    });
    const s = buildSummary(active, [active], NOW);
    expect(s.active).toBe(true);
    expect(s.remainingMinutes).toBe(20);
    expect(s.sessionType).toBe("deep_work");
  });

  it("aggregates completed and interrupted counts", () => {
    const sessions = [
      completedSession("a", "deep_work", 50, { interruptions: [makeInterruptionFixture()] }),
      completedSession("b", "shallow_work", 25),
    ];
    const s = buildSummary(null, sessions, NOW);
    expect(s.completedToday).toBe(2);
    expect(s.interruptionsToday).toBe(1);
    expect(s.focusMinutesToday).toBe(75);
    expect(s.deepWorkMinutesToday).toBe(50);
  });

  it("builds a daily snapshot from sessions", () => {
    const snap = buildDailySnapshot(
      "2026-07-11",
      [completedSession("a", "deep_work", 50, { plannerBlockId: "b" })],
      NOW,
    );
    expect(snap.date).toBe("2026-07-11");
    expect(snap.deepWorkMinutes).toBe(50);
    expect(snap.focusMinutes).toBe(50);
    expect(snap.completedSessions).toBe(1);
    expect(snap.plannerAccuracy).toBe(100);
  });
});
