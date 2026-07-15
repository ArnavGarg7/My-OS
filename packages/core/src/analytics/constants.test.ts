import { describe, expect, it } from "vitest";
import {
  COMPARISON_PERIODS,
  FOCUS_WEIGHTS,
  OVERALL_WEIGHTS,
  PRODUCTIVITY_WEIGHTS,
  REPORT_SPAN_DAYS,
  REPORT_TYPES,
  scoreBand,
} from "./constants";

const sumValues = (o: Record<string, number>) =>
  Math.round(Object.values(o).reduce((a, b) => a + b, 0) * 100) / 100;

describe("analytics constants", () => {
  it("declares five report types + comparison periods", () => {
    expect(REPORT_TYPES).toHaveLength(5);
    expect(COMPARISON_PERIODS).toContain("previous_week");
  });

  it("keeps score weight sets normalised to 1", () => {
    expect(sumValues(PRODUCTIVITY_WEIGHTS)).toBe(1);
    expect(sumValues(FOCUS_WEIGHTS)).toBe(1);
    expect(sumValues(OVERALL_WEIGHTS)).toBe(1);
  });

  it("maps report spans", () => {
    expect(REPORT_SPAN_DAYS.weekly).toBe(7);
    expect(REPORT_SPAN_DAYS.yearly).toBe(365);
  });

  it("bands scores editorially", () => {
    expect(scoreBand(90)).toBe("excellent");
    expect(scoreBand(75)).toBe("good");
    expect(scoreBand(55)).toBe("fair");
    expect(scoreBand(30)).toBe("poor");
  });
});
