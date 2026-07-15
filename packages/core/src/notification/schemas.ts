import { z } from "zod";
import {
  DELIVERY_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  REMINDER_WINDOWS,
} from "./constants";

/**
 * Notification zod schemas (Sprint 3.3). Validate the tRPC surface — listing,
 * snoozing, completing, scheduling, preferences. Deterministic.
 */
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITIES);
export const deliveryChannelSchema = z.enum(DELIVERY_CHANNELS);
export const reminderWindowSchema = z.enum(REMINDER_WINDOWS);

export const listNotificationsSchema = z.object({
  status: z.enum(["active", "unread", "queued", "all"]).optional(),
  type: notificationTypeSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const notificationIdSchema = z.object({ id: z.string().uuid() });

export const snoozeSchema = z.object({
  id: z.string().uuid(),
  window: reminderWindowSchema.optional(),
  minutes: z.number().int().min(1).max(1440).optional(),
});

export const scheduleSchema = z.object({
  id: z.string().uuid(),
  window: reminderWindowSchema.optional(),
  minutes: z.number().int().min(0).max(1440).optional(),
});

export const categoryPreferenceSchema = z.object({
  type: notificationTypeSchema,
  enabled: z.boolean().optional(),
  desktop: z.boolean().optional(),
  push: z.boolean().optional(),
  sound: z.boolean().optional(),
  banner: z.boolean().optional(),
  persistent: z.boolean().optional(),
});

export const updatePreferencesSchema = z.object({
  quietHours: z
    .object({
      enabled: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .optional(),
  workingHoursOnly: z.boolean().optional(),
  weekendSuppression: z.boolean().optional(),
  muted: z.boolean().optional(),
  category: categoryPreferenceSchema.optional(),
});

export const historySchema = z.object({ limit: z.number().int().min(1).max(200).optional() });
