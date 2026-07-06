import { describe, expect, it } from "vitest";
import { filterCommands, highlightMatch, matchesQuery } from "./matching";
import type { Command } from "./types";

const command: Command = {
  id: "nav:/health",
  title: "Open Health",
  subtitle: "Workouts, sleep, water",
  category: "navigation",
  keywords: ["wellness", "fitness"],
  execute: () => {},
};

describe("matchesQuery", () => {
  it("matches on title (case-insensitive)", () => {
    expect(matchesQuery(command, "health")).toBe(true);
    expect(matchesQuery(command, "HEALTH")).toBe(true);
  });
  it("matches on subtitle and keywords", () => {
    expect(matchesQuery(command, "sleep")).toBe(true);
    expect(matchesQuery(command, "fitness")).toBe(true);
  });
  it("empty query matches everything", () => {
    expect(matchesQuery(command, "")).toBe(true);
  });
  it("does not match unrelated text", () => {
    expect(matchesQuery(command, "planner")).toBe(false);
  });
});

describe("filterCommands", () => {
  it("filters while preserving order", () => {
    const a = { ...command, id: "a", title: "Alpha" };
    const b = { ...command, id: "b", title: "Bravo" };
    expect(filterCommands([a, b], "brav").map((c) => c.id)).toEqual(["b"]);
    expect(filterCommands([a, b], "")).toHaveLength(2);
  });
});

describe("highlightMatch", () => {
  it("splits the first match", () => {
    expect(highlightMatch("Open Health", "health")).toEqual([
      { text: "Open ", match: false },
      { text: "Health", match: true },
    ]);
  });
  it("returns a single segment when there is no match", () => {
    expect(highlightMatch("Open Health", "xyz")).toEqual([{ text: "Open Health", match: false }]);
  });
});
