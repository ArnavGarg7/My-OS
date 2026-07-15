import { describe, expect, it } from "vitest";
import { contextForHour, headlinePrompt, promptsFor } from "./prompts";

describe("prompts", () => {
  it("returns prompts for a context", () => {
    const morning = promptsFor("morning");
    expect(morning.length).toBeGreaterThan(0);
    expect(morning[0]?.context).toBe("morning");
  });

  it("picks a context from the hour", () => {
    expect(contextForHour(7)).toBe("morning");
    expect(contextForHour(14)).toBe("any");
    expect(contextForHour(20)).toBe("evening");
  });

  it("returns a headline prompt", () => {
    expect(headlinePrompt("evening").text).toBe("What went well today?");
  });

  it("gives every prompt a stable id", () => {
    expect(promptsFor("weekly").map((p) => p.id)).toEqual(["weekly-0", "weekly-1", "weekly-2"]);
  });
});
