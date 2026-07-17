import { z } from "zod";
import { DASHBOARD_WIDGETS, REPORT_FORMATS, REVIEW_PERIODS } from "./constants";

/**
 * Intelligence zod schemas (Sprint 4.4). Validate the tRPC surface. The only inputs are
 * config (dashboard layout, collections) and requests to snapshot/report — every derived
 * view is a query, because none of them are stored.
 */
const id = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const dashboardPreferencesSchema = z.object({
  widgetOrder: z.array(z.enum(DASHBOARD_WIDGETS)).max(DASHBOARD_WIDGETS.length),
  hiddenWidgets: z.array(z.enum(DASHBOARD_WIDGETS)).max(DASHBOARD_WIDGETS.length).optional(),
});

export const collectionInputSchema = z.object({
  name: z.string().min(1).max(120),
  entityRefs: z
    .array(z.object({ module: z.string().max(40), id: z.string().max(64) }))
    .max(500)
    .optional(),
});
export const updateCollectionSchema = collectionInputSchema.partial().extend({ id });
export const collectionRefSchema = z.object({
  id,
  ref: z.object({ module: z.string().max(40), id: z.string().max(64) }),
});

export const generateReviewSchema = z.object({
  period: z.enum(REVIEW_PERIODS),
  periodStart: dateStr.optional(),
});

export const generateReportSchema = z.object({
  period: z.enum(REVIEW_PERIODS),
  format: z.enum(REPORT_FORMATS).optional(),
});

export const idSchema = z.object({ id });
