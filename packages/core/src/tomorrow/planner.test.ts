import { describe, expect, it } from "vitest";
import { mergeCalendar, summarizePreview } from "./planner";
import { at, makeCalendar } from "./fixtures";
import type { PlannerPreviewBlock } from "./types";

describe("mergeCalendar", () => {
  it("computes meeting minutes + count", () => {
    const merged = mergeCalendar(makeCalendar());
    // 30 (standup) + 90 (lecture) + 30 (1:1) = 150
    expect(merged.meetingMinutes).toBe(150);
    expect(merged.meetingCount).toBe(3);
    expect(merged.firstEventAt).toBe(at(2026, 6, 8, 9));
  });
  it("finds free windows between events", () => {
    const merged = mergeCalendar(makeCalendar());
    // gap between standup end (09:30) and lecture (11:00) = 90m
    expect(merged.freeWindows.some((w) => w.minutes === 90)).toBe(true);
  });
  it("flags a meeting-heavy day", () => {
    const heavy = mergeCalendar([
      { id: "m1", title: "A", start: at(2026, 6, 8, 9), end: at(2026, 6, 8, 12), kind: "meeting" },
    ]);
    expect(heavy.meetingHeavy).toBe(true);
  });
  it("is empty-safe", () => {
    const merged = mergeCalendar([]);
    expect(merged.meetingMinutes).toBe(0);
    expect(merged.firstEventAt).toBeNull();
  });
});

describe("summarizePreview", () => {
  const blocks: PlannerPreviewBlock[] = [
    {
      id: "b1",
      title: "Deep work",
      start: at(2026, 6, 8, 9),
      end: at(2026, 6, 8, 11),
      kind: "focus",
      minutes: 120,
      locked: false,
    },
    {
      id: "b2",
      title: "Review",
      start: at(2026, 6, 8, 14),
      end: at(2026, 6, 8, 15),
      kind: "admin",
      minutes: 60,
      locked: true,
    },
  ];
  it("totals minutes + utilization", () => {
    const p = summarizePreview("2026-07-08", blocks);
    expect(p.totalMinutes).toBe(180);
    expect(p.blockCount).toBe(2);
    expect(p.utilization).toBe(38); // 180 / 480
    expect(p.status).toBe("draft");
  });
  it("sorts blocks by start", () => {
    const p = summarizePreview("2026-07-08", [blocks[1]!, blocks[0]!]);
    expect(p.blocks[0]!.id).toBe("b1");
  });
  it("is empty-safe", () => {
    const p = summarizePreview("2026-07-08", []);
    expect(p.totalMinutes).toBe(0);
    expect(p.utilization).toBe(0);
  });
  it("carries an accepted status", () => {
    expect(summarizePreview("2026-07-08", blocks, "accepted").status).toBe("accepted");
  });
});

describe("mergeCalendar edge cases", () => {
  it("ignores gaps under 30 minutes", () => {
    const merged = mergeCalendar([
      {
        id: "a",
        title: "A",
        start: at(2026, 6, 8, 9),
        end: at(2026, 6, 8, 9, 30),
        kind: "meeting",
      },
      {
        id: "b",
        title: "B",
        start: at(2026, 6, 8, 9, 45),
        end: at(2026, 6, 8, 10),
        kind: "meeting",
      },
    ]);
    expect(merged.freeWindows).toHaveLength(0);
  });
  it("does not count non-meeting events as meetings", () => {
    const merged = mergeCalendar([
      {
        id: "a",
        title: "Reminder",
        start: at(2026, 6, 8, 9),
        end: at(2026, 6, 8, 10),
        kind: "event",
      },
    ]);
    expect(merged.meetingMinutes).toBe(0);
    expect(merged.meetingCount).toBe(0);
  });
  it("tracks the last event end", () => {
    const merged = mergeCalendar(makeCalendar());
    expect(merged.lastEventEndsAt).toBe(at(2026, 6, 8, 15, 30));
  });
});
