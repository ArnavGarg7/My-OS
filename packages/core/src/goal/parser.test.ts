import { describe, expect, it } from "vitest";
import { parseGoal } from "./parser";

describe("parser", () => {
  it("detects a goal type from a tag", () => {
    expect(parseGoal("Get promoted #career").goalType).toBe("career");
  });

  it("infers a type from keywords", () => {
    expect(parseGoal("Save more money this year").goalType).toBe("finance");
    expect(parseGoal("Go to the gym regularly").goalType).toBe("health");
  });

  it("detects a habit frequency", () => {
    expect(parseGoal("Meditate daily").habitFrequency).toBe("daily");
    expect(parseGoal("Review finances weekly").habitFrequency).toBe("weekly");
  });

  it("parses an explicit target date", () => {
    expect(parseGoal("Ship the app by 2026-12-31").targetDate).toBe("2026-12-31");
  });

  it("parses a 'by <year>' target", () => {
    expect(parseGoal("Graduate by 2027").targetDate).toBe("2027-12-31");
  });

  it("strips tags from the title", () => {
    expect(parseGoal("Learn Spanish #education").title).toBe("Learn Spanish");
  });

  it("defaults to personal + Untitled", () => {
    const p = parseGoal("#unknownfoo");
    expect(p.goalType).toBe("personal");
    expect(p.title).toBe("Untitled goal");
  });
});
