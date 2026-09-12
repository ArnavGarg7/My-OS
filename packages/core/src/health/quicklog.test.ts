import { describe, expect, it } from "vitest";
import {
  HYDRATION_PRESETS,
  SLEEP_DURATIONS_HOURS,
  WORKOUT_DURATIONS_MIN,
  WORKOUT_PRESETS,
} from "./quicklog";
import { HYDRATION_SOURCES, WORKOUT_TYPES, logWaterSchema, logWorkoutSchema } from "./index";

describe("health quick-log presets", () => {
  it("uses only valid hydration sources and in-range amounts", () => {
    for (const group of HYDRATION_PRESETS) {
      expect(HYDRATION_SOURCES).toContain(group.source);
      expect(group.amounts.length).toBeGreaterThan(0);
      for (const a of group.amounts) {
        // Each preset must pass the real log schema, not just be a number.
        expect(logWaterSchema.safeParse({ amountMl: a.ml, source: group.source }).success).toBe(
          true,
        );
      }
    }
  });

  it("covers every workout type with valid durations", () => {
    expect(WORKOUT_PRESETS.map((w) => w.type).sort()).toEqual([...WORKOUT_TYPES].sort());
    for (const w of WORKOUT_PRESETS) {
      for (const min of WORKOUT_DURATIONS_MIN) {
        expect(logWorkoutSchema.safeParse({ type: w.type, durationMinutes: min }).success).toBe(
          true,
        );
      }
    }
  });

  it("offers sensible sleep durations", () => {
    expect(SLEEP_DURATIONS_HOURS.every((h) => h > 0 && h <= 12)).toBe(true);
  });
});
