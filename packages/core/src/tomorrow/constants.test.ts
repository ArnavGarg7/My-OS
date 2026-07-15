import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHECKLIST,
  HEAVY_MEETING_MINUTES,
  MAX_PRIORITIES,
  OVERLOADED_CARRY_FORWARD,
  PRIORITY_WEIGHTS,
  STEP_LABEL,
  STUDIO_STEPS,
  TOMORROW_STATUSES,
  TOP_PRIORITIES,
  intensityBand,
} from "./constants";

describe("tomorrow constants", () => {
  it("declares eight ordered steps, each labelled", () => {
    expect(STUDIO_STEPS).toHaveLength(8);
    expect(STUDIO_STEPS[0]).toBe("review");
    expect(STUDIO_STEPS[7]).toBe("finalize");
    for (const s of STUDIO_STEPS) expect(STEP_LABEL[s]).toBeTruthy();
  });

  it("declares four lifecycle statuses", () => {
    expect(TOMORROW_STATUSES).toEqual(["draft", "planned", "locked", "completed"]);
  });

  it("keeps top ≤ max priorities", () => {
    expect(TOP_PRIORITIES).toBeLessThanOrEqual(MAX_PRIORITIES);
  });

  it("weights task priority highest", () => {
    const w = PRIORITY_WEIGHTS;
    expect(w.taskPriority).toBeGreaterThanOrEqual(w.projectUrgency);
    expect(w.calendarLoad).toBeLessThan(w.taskPriority);
  });

  it("has a required-item checklist template", () => {
    expect(DEFAULT_CHECKLIST.length).toBeGreaterThan(0);
    expect(DEFAULT_CHECKLIST.some((c) => c.required)).toBe(true);
  });

  it("sets sensible thresholds", () => {
    expect(OVERLOADED_CARRY_FORWARD).toBeGreaterThan(0);
    expect(HEAVY_MEETING_MINUTES).toBeGreaterThanOrEqual(120);
  });

  it("bands intensity by committed minutes", () => {
    expect(intensityBand(60)).toBe("light");
    expect(intensityBand(240)).toBe("moderate");
    expect(intensityBand(400)).toBe("heavy");
  });
});
