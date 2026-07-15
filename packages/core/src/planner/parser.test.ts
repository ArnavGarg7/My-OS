import { describe, expect, it } from "vitest";
import { parseBlock } from "./parser";
import { DATE, at } from "./fixtures";

const NOW = at(8);

describe("parseBlock", () => {
  it("parses a time range and strips it from the title", () => {
    const b = parseBlock("Team sync 2pm-3pm", DATE, NOW)!;
    expect(b.title).toBe("Team sync");
    expect(b.type).toBe("meeting");
    expect(new Date(b.startTime).getHours()).toBe(14);
    expect(new Date(b.endTime).getHours()).toBe(15);
    expect(b.source).toBe("manual");
    expect(b.generated).toBe(false);
  });

  it("detects a break", () => {
    const b = parseBlock("Lunch 12:00-13:00", DATE, NOW)!;
    expect(b.type).toBe("break");
  });

  it("parses a start time plus a duration", () => {
    const b = parseBlock("Standup 9am 30m", DATE, NOW)!;
    expect(new Date(b.startTime).getHours()).toBe(9);
    expect(new Date(b.endTime).getMinutes()).toBe(30);
  });

  it("parses hour durations", () => {
    const b = parseBlock("Workshop 10am 2h", DATE, NOW)!;
    expect(new Date(b.endTime).getHours()).toBe(12);
  });

  it("returns null when there is no parseable time", () => {
    expect(parseBlock("just a note", DATE, NOW)).toBeNull();
  });

  it("returns null when the end is not after the start", () => {
    expect(parseBlock("Bad 3pm-2pm", DATE, NOW)).toBeNull();
  });

  it("accepts a 'to' separator", () => {
    const b = parseBlock("Review 3pm to 4pm", DATE, NOW)!;
    expect(new Date(b.startTime).getHours()).toBe(15);
    expect(new Date(b.endTime).getHours()).toBe(16);
  });

  it("accepts an en-dash range", () => {
    const b = parseBlock("Call 11am–11:30am", DATE, NOW)!;
    expect(new Date(b.endTime).getMinutes()).toBe(30);
  });

  it("falls back to 'Untitled block' when only a time is given", () => {
    const b = parseBlock("2pm-3pm", DATE, NOW)!;
    expect(b.title).toBe("Untitled block");
  });
});
