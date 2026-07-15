import { describe, expect, it } from "vitest";
import { parseDue, parseDuration, parseTask } from "./parser";

const NOW = new Date(2026, 6, 7, 9, 0, 0); // Tue 2026-07-07 09:00 local

describe("parseDuration", () => {
  it("parses minutes, hours, decimals and combinations", () => {
    expect(parseDuration("call for 30 min")).toBe(30);
    expect(parseDuration("deep work 2h")).toBe(120);
    expect(parseDuration("nap 1.5h")).toBe(90);
    expect(parseDuration("session 1h 30m")).toBe(90);
  });
  it("returns null when no duration is present", () => {
    expect(parseDuration("buy milk")).toBeNull();
  });
});

describe("parseDue", () => {
  it("resolves tomorrow to the next day at 09:00", () => {
    const iso = parseDue("submit tomorrow", NOW)!;
    const d = new Date(iso);
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(9);
  });

  it("resolves tonight to today at 19:00", () => {
    const d = new Date(parseDue("ship tonight", NOW)!);
    expect(d.getDate()).toBe(7);
    expect(d.getHours()).toBe(19);
  });

  it("resolves 'in 3 days'", () => {
    expect(new Date(parseDue("review in 3 days", NOW)!).getDate()).toBe(10);
  });

  it("uses the part-of-day hour for tomorrow morning", () => {
    expect(new Date(parseDue("tomorrow morning", NOW)!).getHours()).toBe(9);
  });

  it("returns null with no date hint", () => {
    expect(parseDue("just a note", NOW)).toBeNull();
  });
});

describe("parseTask", () => {
  it("extracts a clean title and due date from a natural phrase", () => {
    const draft = parseTask("Submit assignment tomorrow morning", NOW);
    expect(draft.title).toBe("Submit assignment");
    expect(new Date(draft.dueAt!).getDate()).toBe(8);
  });

  it("captures priority + estimate + recurrence hints and strips them", () => {
    const draft = parseTask("Deploy every 2 weeks urgent 2h", NOW);
    expect(draft.title).toBe("Deploy");
    expect(draft.priority).toBe("urgent");
    expect(draft.estimatedMinutes).toBe(120);
    expect(draft.recurrence).toEqual({ frequency: "weekly", interval: 2 });
  });

  it("extracts urls and keeps a description from later lines", () => {
    const draft = parseTask("Read article\nhttps://example.com/post\nnotes here", NOW);
    expect(draft.title).toBe("Read article");
    expect(draft.urls).toContain("https://example.com/post");
    expect(draft.description).toContain("notes here");
  });

  it("defaults priority to medium and estimate to null", () => {
    const draft = parseTask("Water the plants", NOW);
    expect(draft.priority).toBe("medium");
    expect(draft.estimatedMinutes).toBeNull();
  });

  it("falls back to 'Untitled task' for empty input", () => {
    expect(parseTask("   ", NOW).title).toBe("Untitled task");
  });
});
