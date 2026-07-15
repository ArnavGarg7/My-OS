import { describe, expect, it } from "vitest";
import { parseComparisonPeriod, parseReportType } from "./parser";

describe("parseReportType", () => {
  it("maps keywords to report types", () => {
    expect(parseReportType("weekly review")).toBe("weekly");
    expect(parseReportType("show me the month")).toBe("monthly");
    expect(parseReportType("quarter report")).toBe("quarterly");
    expect(parseReportType("year in review")).toBe("yearly");
    expect(parseReportType("today")).toBe("daily");
  });
  it("returns null for gibberish", () => {
    expect(parseReportType("wibble")).toBeNull();
  });
});

describe("parseComparisonPeriod", () => {
  it("maps keywords to comparison periods", () => {
    expect(parseComparisonPeriod("vs last week")).toBe("previous_week");
    expect(parseComparisonPeriod("compare to yesterday")).toBe("previous_day");
    expect(parseComparisonPeriod("month over month")).toBe("previous_month");
  });
  it("returns null when unclear", () => {
    expect(parseComparisonPeriod("hello")).toBeNull();
  });
});
