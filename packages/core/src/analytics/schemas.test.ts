import { describe, expect, it } from "vitest";
import {
  compareSchema,
  forecastSchema,
  generateReportSchema,
  periodSchema,
  reviewSchema,
  trendSchema,
} from "./schemas";

describe("periodSchema", () => {
  it("accepts an optional report type", () => {
    expect(periodSchema.parse({}).type).toBeUndefined();
    expect(periodSchema.parse({ type: "monthly" }).type).toBe("monthly");
  });
  it("rejects an unknown type", () => {
    expect(() => periodSchema.parse({ type: "decade" })).toThrow();
  });
});

describe("reviewSchema", () => {
  it("requires a valid report type", () => {
    expect(reviewSchema.parse({ type: "quarterly" }).type).toBe("quarterly");
    expect(() => reviewSchema.parse({})).toThrow();
  });
});

describe("compareSchema", () => {
  it("accepts a comparison period + optional metric", () => {
    const parsed = compareSchema.parse({ period: "previous_week", metric: "productivity" });
    expect(parsed.period).toBe("previous_week");
  });
  it("rejects an unknown period", () => {
    expect(() => compareSchema.parse({ period: "previous_decade" })).toThrow();
  });
});

describe("forecastSchema", () => {
  it("bounds the horizon", () => {
    expect(forecastSchema.parse({ horizonDays: 30 }).horizonDays).toBe(30);
    expect(() => forecastSchema.parse({ horizonDays: 0 })).toThrow();
    expect(() => forecastSchema.parse({ horizonDays: 400 })).toThrow();
  });
});

describe("trendSchema + generateReportSchema", () => {
  it("validates a trend window", () => {
    expect(trendSchema.parse({ window: "month" }).window).toBe("month");
    expect(() => trendSchema.parse({ window: "fortnight" })).toThrow();
  });
  it("validates report generation", () => {
    expect(generateReportSchema.parse({ type: "yearly" }).type).toBe("yearly");
  });
});
