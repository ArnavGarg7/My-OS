import { describe, expect, it } from "vitest";
import {
  EVENT_IMPORTANCE,
  IMPORTANCE,
  MEMORY_PROMOTION_THRESHOLD,
  MEMORY_TYPES,
  MEMORY_TYPE_BY_EVENT,
  SNAPSHOT_TYPES,
  TIMELINE_SOURCES,
} from "./constants";

describe("timeline constants", () => {
  it("declares all 14 sources including today/automation/orchestration/ai", () => {
    expect(TIMELINE_SOURCES).toHaveLength(14);
    expect(TIMELINE_SOURCES).toContain("today");
    expect(TIMELINE_SOURCES).toContain("automation");
    expect(TIMELINE_SOURCES).toContain("orchestration");
    expect(TIMELINE_SOURCES).toContain("ai");
  });

  it("orders importance bands ascending", () => {
    expect(IMPORTANCE.trivial).toBeLessThan(IMPORTANCE.normal);
    expect(IMPORTANCE.normal).toBeLessThan(IMPORTANCE.milestone);
    expect(IMPORTANCE.milestone).toBe(100);
  });

  it("scores goal.completed at the milestone band", () => {
    expect(EVENT_IMPORTANCE["goal.completed"]).toBe(IMPORTANCE.milestone);
  });

  it("keeps the promotion threshold at the major band", () => {
    expect(MEMORY_PROMOTION_THRESHOLD).toBe(IMPORTANCE.major);
  });

  it("maps every explicit promotion to a valid memory type", () => {
    for (const type of Object.values(MEMORY_TYPE_BY_EVENT)) {
      expect(MEMORY_TYPES).toContain(type);
    }
  });

  it("declares the four snapshot periods", () => {
    expect(SNAPSHOT_TYPES).toEqual(["week", "month", "quarter", "year"]);
  });
});
