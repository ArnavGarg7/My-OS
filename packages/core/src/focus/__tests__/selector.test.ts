import { describe, expect, it } from "vitest";
import { orderCandidates, selectNext, type FocusCandidate } from "../selector";

function candidate(over: Partial<FocusCandidate>): FocusCandidate {
  return {
    taskId: "t",
    plannerBlockId: null,
    projectId: null,
    title: "Task",
    scheduledFor: null,
    priorityScore: 0,
    isMeeting: false,
    estimateMinutes: null,
    ...over,
  };
}

describe("focus selector", () => {
  it("orders scheduled candidates before unscheduled", () => {
    const list = orderCandidates([
      candidate({ title: "later", scheduledFor: null, priorityScore: 9 }),
      candidate({ title: "soon", scheduledFor: "2026-07-11T10:00:00Z" }),
    ]);
    expect(list[0]?.title).toBe("soon");
  });

  it("breaks ties by priority then title", () => {
    const list = orderCandidates([
      candidate({ title: "b", priorityScore: 5 }),
      candidate({ title: "a", priorityScore: 5 }),
      candidate({ title: "c", priorityScore: 8 }),
    ]);
    expect(list.map((c) => c.title)).toEqual(["c", "a", "b"]);
  });

  it("selectNext skips meetings", () => {
    const sel = selectNext([
      candidate({ title: "meeting", isMeeting: true, scheduledFor: "2026-07-11T09:00:00Z" }),
      candidate({ title: "work", scheduledFor: "2026-07-11T10:00:00Z" }),
    ]);
    expect(sel?.candidate.title).toBe("work");
  });

  it("suggests deep_work for long high-priority work", () => {
    const sel = selectNext([candidate({ estimateMinutes: 60, priorityScore: 8 })]);
    expect(sel?.type).toBe("deep_work");
  });

  it("suggests focus for short work", () => {
    const sel = selectNext([candidate({ estimateMinutes: 20, priorityScore: 8 })]);
    expect(sel?.type).toBe("focus");
  });

  it("returns null when only meetings remain", () => {
    expect(selectNext([candidate({ isMeeting: true })])).toBeNull();
  });

  it("defaults planned minutes to 50", () => {
    const sel = selectNext([candidate({ estimateMinutes: null })]);
    expect(sel?.plannedMinutes).toBe(50);
  });
});
