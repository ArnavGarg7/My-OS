import { describe, expect, it } from "vitest";
import { confidenceInputs, computeConfidence, confidenceFor } from "./confidence";
import { bestFocusWindow, biggestRisk, breakDue, topOpportunity } from "./signals";
import { optimizePlan } from "./planner";
import { rescuePlan } from "./replanning";
import { morningIntelligence, preparationChecklist } from "./morning";
import { buildNightPlan, nightReview } from "./night";
import { recommendedBreakMinutes, shouldBreak, suggestedFocusMinutes } from "./focus";
import { makeContext } from "./fixtures";
import { defaultProfile } from "./profile";

describe("confidence", () => {
  it("is very_high with full grounding and no conflicts", () => {
    expect(
      confidenceFor(
        makeContext({
          planBlocks: [
            {
              id: "b",
              title: "x",
              start: "2026-07-18T10:00:00.000Z",
              end: "2026-07-18T11:00:00.000Z",
              type: "deep_work",
              status: "planned",
              locked: false,
            },
          ],
        }),
      ),
    ).toBe("very_high");
  });
  it("drops with conflicts", () => {
    expect(
      computeConfidence({
        hasPlan: true,
        hasFocusWindow: true,
        conflicts: 1,
        hasReadiness: true,
        hasCandidates: true,
      }),
    ).toBe("high");
    expect(
      computeConfidence({
        hasPlan: true,
        hasFocusWindow: true,
        conflicts: 2,
        hasReadiness: true,
        hasCandidates: true,
      }),
    ).toBe("medium");
  });
  it("is low with nothing", () => {
    expect(
      computeConfidence(
        confidenceInputs(
          makeContext({
            tasks: [],
            focusWindows: [],
            planBlocks: [],
            readiness: null,
            energy: null,
          }),
        ),
      ),
    ).toBe("low");
  });
});

describe("signals", () => {
  it("finds the best (uninterrupted) window", () => {
    expect(bestFocusWindow(makeContext())?.uninterrupted).toBe(true);
  });
  it("flags the single-focus-block risk", () => {
    const ctx = makeContext({
      focusWindows: [
        {
          start: "2026-07-18T10:00:00.000Z",
          end: "2026-07-18T11:30:00.000Z",
          minutes: 90,
          uninterrupted: true,
        },
      ],
    });
    expect(biggestRisk(ctx)).toContain("one uninterrupted");
  });
  it("surfaces an opportunity for an ideal window", () => {
    expect(topOpportunity(makeContext())).toContain("uninterrupted");
  });
  it("detects a due break", () => {
    expect(
      breakDue(
        makeContext({
          activeFocusSession: { startedAt: "2026-07-18T09:00:00.000Z", plannedMinutes: 90 },
        }),
      ),
    ).toBe(true);
  });
});

describe("optimize (proposal)", () => {
  it("proposes a break for an over-long block and never mutates", () => {
    const ctx = makeContext({
      planBlocks: [
        {
          id: "b1",
          title: "Marathon",
          start: "2026-07-18T10:00:00.000Z",
          end: "2026-07-18T13:00:00.000Z",
          type: "deep_work",
          status: "planned",
          locked: false,
        },
      ],
    });
    const p = optimizePlan(ctx);
    expect(p.kind).toBe("optimize");
    expect(p.changes.some((c) => c.kind === "break")).toBe(true);
  });
  it("never touches locked blocks", () => {
    const ctx = makeContext({
      planBlocks: [
        {
          id: "b1",
          title: "Locked",
          start: "2026-07-18T10:00:00.000Z",
          end: "2026-07-18T14:00:00.000Z",
          type: "deep_work",
          status: "planned",
          locked: true,
        },
      ],
    });
    expect(optimizePlan(ctx).changes.filter((c) => c.blockId === "b1")).toHaveLength(0);
  });
});

describe("rescue (proposal)", () => {
  it("moves a missed block to tomorrow", () => {
    const p = rescuePlan(
      makeContext({
        disruptions: [
          { kind: "missed_block", detail: "Algorithms", ref: { module: "planner", id: "b9" } },
        ],
      }),
    );
    expect(p.kind).toBe("rescue");
    expect(p.changes[0]!.to).toBe("tomorrow");
  });
  it("pulls the top task into freed time on a cancellation", () => {
    const p = rescuePlan(
      makeContext({ disruptions: [{ kind: "cancelled_event", detail: "meeting", minutes: 60 }] }),
    );
    expect(p.changes.some((c) => c.to === "now")).toBe(true);
  });
  it("reports no rescue needed when there are no disruptions", () => {
    expect(rescuePlan(makeContext()).changes).toHaveLength(0);
  });
});

describe("morning intelligence", () => {
  it("assembles greeting, mission, recommendation, risk, opportunity, checklist", () => {
    const m = morningIntelligence(makeContext());
    expect(m.greeting).toContain("Arnav");
    expect(m.mission.length).toBe(3);
    expect(m.recommendation.action).toBe("start_focus");
    expect(m.focusWindow?.uninterrupted).toBe(true);
    expect(m.preparationChecklist.length).toBeGreaterThan(0);
  });
  it("prep checklist includes upcoming meetings", () => {
    expect(preparationChecklist(makeContext()).some((i) => i.includes("Internship meeting"))).toBe(
      true,
    );
  });
});

describe("night planning", () => {
  it("carries forward incomplete tasks into a tomorrow proposal", () => {
    const n = buildNightPlan(makeContext());
    expect(n.proposal.kind).toBe("night");
    expect(n.proposal.changes.every((c) => c.to === "tomorrow")).toBe(true);
    expect(n.review.carryForward.length).toBeGreaterThan(0);
  });
  it("reports completed and missed in the review", () => {
    const ctx = makeContext({
      planBlocks: [
        {
          id: "b1",
          title: "Done thing",
          start: "2026-07-18T08:00:00.000Z",
          end: "2026-07-18T09:00:00.000Z",
          type: "deep_work",
          status: "done",
          locked: false,
        },
        {
          id: "b2",
          title: "Missed thing",
          start: "2026-07-18T09:00:00.000Z",
          end: "2026-07-18T10:00:00.000Z",
          type: "deep_work",
          status: "missed",
          locked: false,
        },
      ],
    });
    const r = nightReview(ctx);
    expect(r.completed).toContain("Done thing");
    expect(r.missed).toContain("Missed thing");
  });
});

describe("focus rules", () => {
  it("applies 50→10 / 90→20 break rules", () => {
    expect(recommendedBreakMinutes(95)).toBe(20);
    expect(recommendedBreakMinutes(55)).toBe(10);
    expect(recommendedBreakMinutes(20)).toBe(5);
  });
  it("suggests focus length within the window and respects break cadence", () => {
    const p = defaultProfile();
    expect(shouldBreak(60, p)).toBe(true);
    expect(suggestedFocusMinutes(40, p)).toBe(40);
    expect(suggestedFocusMinutes(200, p)).toBe(120);
  });
});
