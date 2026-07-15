import { z } from "zod";
import { COMPARISON_PERIODS, REPORT_TYPES } from "./constants";

/**
 * Analytics zod schemas (Sprint 2.14). Validate the read-only tRPC surface —
 * report windows, comparisons, forecasts and trends. Analytics is derive-only;
 * there are no create/update inputs beyond persisting a generated report.
 */
export const reportTypeSchema = z.enum(REPORT_TYPES);
export const comparisonPeriodSchema = z.enum(COMPARISON_PERIODS);
export const trendWindowSchema = z.enum(["week", "month", "quarter", "year"]);

export const periodSchema = z.object({ type: reportTypeSchema.optional() });
export type PeriodInput = z.infer<typeof periodSchema>;

export const reviewSchema = z.object({ type: reportTypeSchema });

export const compareSchema = z.object({
  period: comparisonPeriodSchema,
  metric: z.string().max(80).optional(),
});

export const forecastSchema = z.object({
  horizonDays: z.number().int().min(1).max(365).optional(),
  metric: z.string().max(80).optional(),
});

export const trendSchema = z.object({
  window: trendWindowSchema.optional(),
  metric: z.string().max(80).optional(),
});

export const generateReportSchema = z.object({ type: reportTypeSchema });
