import { describe, expect, it } from "vitest";
import { bufferBlock, lunchBreak, makeBlock, timeToDate } from "./blockers";
import { DATE, at } from "./fixtures";

describe("makeBlock", () => {
  it("builds a generated, unpersisted block", () => {
    const b = makeBlock(DATE, "meeting", "Sync", at(14), at(15));
    expect(b.id).toBe("");
    expect(b.type).toBe("meeting");
    expect(b.generated).toBe(true);
    expect(b.startTime).toBe(at(14).toISOString());
  });
});

describe("lunchBreak", () => {
  it("creates a lunch break inside the working window", () => {
    const lunch = lunchBreak(DATE, "09:00", "18:00")!;
    expect(lunch.type).toBe("break");
    expect(lunch.title).toBe("Lunch");
    expect(new Date(lunch.startTime).getHours()).toBe(13);
  });
  it("returns null when the window ends before lunch", () => {
    expect(lunchBreak(DATE, "09:00", "12:00")).toBeNull();
  });
  it("returns null when the window starts after lunch", () => {
    expect(lunchBreak(DATE, "14:00", "18:00")).toBeNull();
  });
});

describe("bufferBlock", () => {
  it("creates a buffer of the given length", () => {
    const b = bufferBlock(DATE, at(10), 15);
    expect(b.type).toBe("buffer");
    expect(new Date(b.endTime).getMinutes()).toBe(15);
  });
});

describe("timeToDate", () => {
  it("resolves HH:MM to a date on the day", () => {
    expect(timeToDate(DATE, "09:30").getHours()).toBe(9);
    expect(timeToDate(DATE, "09:30").getMinutes()).toBe(30);
  });
});

describe("makeBlock overrides", () => {
  it("applies overrides like locked + source", () => {
    const b = makeBlock(DATE, "meeting", "Sync", at(14), at(15), {
      locked: true,
      source: "manual",
      generated: false,
    });
    expect(b.locked).toBe(true);
    expect(b.source).toBe("manual");
    expect(b.generated).toBe(false);
  });
});
