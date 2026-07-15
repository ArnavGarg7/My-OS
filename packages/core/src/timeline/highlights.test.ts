import { describe, expect, it } from "vitest";
import { computeHighlights } from "./highlights";
import { at, day, makeEvent, makeStream } from "./fixtures";

describe("computeHighlights", () => {
  it("finds the biggest achievement by importance", () => {
    const highlights = computeHighlights(makeStream(), day(2026, 6, 10));
    const ach = highlights.find((h) => h.category === "biggest_achievement");
    expect(ach?.eventId).toBe("a"); // goal.completed = 100
  });

  it("finds the longest focus block from metadata", () => {
    const events = [
      makeEvent({ id: "f1", metadata: { focusMinutes: 45 } }),
      makeEvent({ id: "f2", metadata: { focusMinutes: 120 } }),
    ];
    const focus = computeHighlights(events, day(2026, 6, 10)).find(
      (h) => h.category === "longest_focus_block",
    );
    expect(focus?.value).toBe(120);
    expect(focus?.eventId).toBe("f2");
  });

  it("finds the most productive day", () => {
    const highlights = computeHighlights(makeStream(), day(2026, 6, 10));
    const prod = highlights.find((h) => h.category === "most_productive_day");
    expect(prod?.title).toBe(day(2026, 6, 3)); // 2 events
    expect(prod?.value).toBe(2);
  });

  it("finds the biggest spending day summing expenses", () => {
    const events = [
      makeEvent({
        id: "s1",
        eventType: "finance.transaction",
        source: "finance",
        timestamp: at(2026, 6, 2, 10),
        metadata: { amount: 500, direction: "expense" },
      }),
      makeEvent({
        id: "s2",
        eventType: "finance.transaction",
        source: "finance",
        timestamp: at(2026, 6, 2, 14),
        metadata: { amount: 700, direction: "expense" },
      }),
      makeEvent({
        id: "s3",
        eventType: "finance.transaction",
        source: "finance",
        timestamp: at(2026, 6, 2, 16),
        metadata: { amount: 9999, direction: "income" },
      }),
    ];
    const spend = computeHighlights(events, day(2026, 6, 10)).find(
      (h) => h.category === "biggest_spending_day",
    );
    expect(spend?.value).toBe(1200); // income excluded
  });

  it("omits categories without supporting data", () => {
    const events = [makeEvent({ id: "only", eventType: "task.created" })];
    const cats = computeHighlights(events, day(2026, 6, 10)).map((h) => h.category);
    expect(cats).not.toContain("best_workout");
    expect(cats).not.toContain("biggest_spending_day");
  });
});
