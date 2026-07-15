import { describe, expect, it } from "vitest";
import { parseEvent } from "./parser";
import { at } from "./fixtures";

const NOW = at(8); // 08:00 on the Tuesday fixture date

describe("parseEvent", () => {
  it("parses a time range and strips it + the date word", () => {
    const draft = parseEvent("Lunch with Sam 12-1pm tomorrow", NOW);
    expect(draft.title).toBe("Lunch with Sam");
    expect(new Date(draft.startAt!).getDate()).toBe(NOW.getDate() + 1);
    expect(new Date(draft.startAt!).getHours()).toBe(12);
    expect(new Date(draft.endAt!).getHours()).toBe(13);
  });

  it("inherits pm across a range boundary", () => {
    const draft = parseEvent("Sync 12-1pm", NOW);
    expect(new Date(draft.startAt!).getHours()).toBe(12);
    expect(new Date(draft.endAt!).getHours()).toBe(13);
  });

  it("parses a single 'at' time with a default hour duration", () => {
    const draft = parseEvent("Standup at 9am", NOW);
    expect(new Date(draft.startAt!).getHours()).toBe(9);
    expect(new Date(draft.endAt!).getHours()).toBe(10);
  });

  it("handles all-day events", () => {
    const draft = parseEvent("Conference all day tomorrow", NOW);
    expect(draft.allDay).toBe(true);
    expect(draft.title).toBe("Conference");
  });

  it("resolves 'in N days'", () => {
    const draft = parseEvent("Review at 2pm in 3 days", NOW);
    expect(new Date(draft.startAt!).getDate()).toBe(NOW.getDate() + 3);
  });

  it("returns no times when none are present", () => {
    const draft = parseEvent("Think about the roadmap", NOW);
    expect(draft.startAt).toBeNull();
    expect(draft.title).toBe("Think about the roadmap");
  });

  it("falls back to a default title", () => {
    expect(parseEvent("2-3pm", NOW).title).toBe("Untitled event");
  });

  it("defaults to today when no day word is present", () => {
    const draft = parseEvent("Call at 3pm", NOW);
    expect(new Date(draft.startAt!).getDate()).toBe(NOW.getDate());
  });
});
