import { z } from "zod";
import { CALENDAR_PROVIDERS, EVENT_STATUSES, RECURRENCE_FREQUENCIES, WEEKDAYS } from "./constants";

/**
 * Calendar input validation (Sprint 2.7). Shared by tRPC + the service.
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const eventIdSchema = z.string().uuid();

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  interval: z.number().int().min(1).max(365).default(1),
  count: z.number().int().min(1).max(999).nullable().optional(),
  until: z.string().datetime().nullable().optional(),
  byWeekday: z.array(z.enum(WEEKDAYS)).nullable().optional(),
  exdates: z.array(z.string().datetime()).optional(),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(20000).optional(),
  calendarId: z.string().optional(),
  location: z.string().trim().max(500).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default("UTC"),
  allDay: z.boolean().default(false),
  status: z.enum(EVENT_STATUSES).default("confirmed"),
  recurrenceRule: recurrenceRuleSchema.nullable().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({ id: eventIdSchema });

export const eventActionSchema = z.object({ id: eventIdSchema });

export const listEventsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  calendarId: z.string().optional(),
});

export const rangeSchema = z.object({ date: dateSchema.optional() });

export const importSchema = z.object({
  ics: z.string().min(1),
  calendarId: z.string().optional(),
});

export const exportSchema = z.object({ calendarId: z.string().optional() });

export const syncSchema = z.object({ provider: z.enum(CALENDAR_PROVIDERS) });

export const toggleCalendarSchema = z.object({ id: z.string(), visible: z.boolean() });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsInput = z.infer<typeof listEventsSchema>;
export type ImportInput = z.infer<typeof importSchema>;
export type SyncInput = z.infer<typeof syncSchema>;
