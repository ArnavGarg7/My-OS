import { describe, expect, it } from "vitest";
import { suggestDestination } from "./organizer";
import { makeItem } from "./fixtures";

describe("suggestDestination", () => {
  it("always includes General Notes as a fallback", () => {
    const suggestions = suggestDestination(makeItem({ content: "zxqw nonsense" }));
    expect(suggestions.some((s) => s.destination === "General Notes")).toBe(true);
  });

  it("ranks a type hint highly (task → Planner)", () => {
    const suggestions = suggestDestination(makeItem({ type: "task", content: "buy milk" }));
    expect(suggestions[0]?.destination).toBe("Planner");
  });

  it("maps journal captures to Journal", () => {
    const suggestions = suggestDestination(
      makeItem({ type: "journal", content: "grateful today" }),
    );
    expect(suggestions[0]?.destination).toBe("Journal");
  });

  it("maps decision_note captures to Decision", () => {
    const suggestions = suggestDestination(
      makeItem({ type: "decision_note", content: "should i take the offer" }),
    );
    expect(suggestions[0]?.destination).toBe("Decision");
  });

  it("suggests Finance from budget/expense keywords", () => {
    const suggestions = suggestDestination(
      makeItem({ type: "text", content: "track my monthly budget and rent expense" }),
    );
    expect(suggestions[0]?.destination).toBe("Finance");
    expect(suggestions[0]!.confidence).toBeGreaterThan(0);
  });

  it("suggests College from coursework keywords", () => {
    const suggestions = suggestDestination(
      makeItem({ type: "text", content: "finish the algorithms assignment before the exam" }),
    );
    expect(suggestions[0]?.destination).toBe("College");
  });

  it("is deterministic — same input yields identical output", () => {
    const item = makeItem({ type: "text", content: "ship the project milestone" });
    expect(suggestDestination(item)).toEqual(suggestDestination(item));
  });

  it("returns a human reason for the top suggestion", () => {
    const suggestions = suggestDestination(makeItem({ type: "task", content: "call the dentist" }));
    expect(suggestions[0]!.reason).toMatch(/task|Planner|Mentions/);
  });

  it("clamps confidence to 100", () => {
    const suggestions = suggestDestination(
      makeItem({ type: "task", content: "plan schedule tomorrow calendar deadline agenda todo" }),
    );
    expect(suggestions[0]!.confidence).toBeLessThanOrEqual(100);
  });
});
