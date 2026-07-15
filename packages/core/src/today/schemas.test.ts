import { describe, expect, it } from "vitest";
import {
  addNoteSchema,
  dateSchema,
  timeSchema,
  updateFocusSchema,
  updateMetricsSchema,
  updateStateSchema,
} from "./schemas";

describe("primitive schemas", () => {
  it("validates dates", () => {
    expect(dateSchema.safeParse("2026-07-06").success).toBe(true);
    expect(dateSchema.safeParse("2026/07/06").success).toBe(false);
    expect(dateSchema.safeParse("nope").success).toBe(false);
  });
  it("validates times", () => {
    expect(timeSchema.safeParse("09:30").success).toBe(true);
    expect(timeSchema.safeParse("24:00").success).toBe(false);
    expect(timeSchema.safeParse("9:5").success).toBe(false);
  });
});

describe("updateStateSchema", () => {
  it("is fully partial and enum-checked", () => {
    expect(updateStateSchema.safeParse({}).success).toBe(true);
    expect(updateStateSchema.safeParse({ status: "active", energyLevel: "high" }).success).toBe(
      true,
    );
    expect(updateStateSchema.safeParse({ status: "bogus" }).success).toBe(false);
    expect(updateStateSchema.safeParse({ energyLevel: "extreme" }).success).toBe(false);
  });
  it("accepts nullable fields", () => {
    expect(updateStateSchema.safeParse({ wakeTime: null, energyLevel: null }).success).toBe(true);
  });
});

describe("updateFocusSchema", () => {
  it("bounds field length", () => {
    expect(updateFocusSchema.safeParse({ mission: "a".repeat(280) }).success).toBe(true);
    expect(updateFocusSchema.safeParse({ mission: "a".repeat(281) }).success).toBe(false);
    expect(updateFocusSchema.safeParse({ mission: null }).success).toBe(true);
  });
});

describe("updateMetricsSchema", () => {
  it("enforces non-negative bounds", () => {
    expect(updateMetricsSchema.safeParse({ completedTasks: 3, deepWorkMinutes: 120 }).success).toBe(
      true,
    );
    expect(updateMetricsSchema.safeParse({ completedTasks: -1 }).success).toBe(false);
    expect(updateMetricsSchema.safeParse({ plannerAccuracy: 150 }).success).toBe(false);
    expect(updateMetricsSchema.safeParse({ plannerAccuracy: null }).success).toBe(true);
  });
});

describe("addNoteSchema", () => {
  it("requires content and defaults the type", () => {
    const parsed = addNoteSchema.safeParse({ content: "Remember this" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.type).toBe("note");
    expect(addNoteSchema.safeParse({ content: "  " }).success).toBe(false);
    expect(addNoteSchema.safeParse({ content: "x", type: "thought" }).success).toBe(true);
    expect(addNoteSchema.safeParse({ content: "x", type: "invalid" }).success).toBe(false);
  });
});
