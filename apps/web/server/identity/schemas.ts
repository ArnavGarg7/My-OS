import { z } from "zod";

/**
 * Input validation for identity mutations (Sprint 1.5). The update DTOs are
 * derived from these schemas (single source of truth), so tRPC, the service,
 * and the DB layer all agree on shape.
 */

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const timeFormatSchema = z.enum(["12h", "24h"]);

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a HH:mm time of day");

const displayName = z.string().trim().min(1).max(80);

/** Profile page — the identity-presentation subset of preferences. */
export const profileUpdateSchema = z
  .object({
    displayName: displayName,
    timezone: z.string().min(1).max(64),
    locale: z.string().min(2).max(35),
    language: z.string().min(2).max(35),
    preferredCurrency: z.string().length(3),
    preferredDateFormat: z.string().min(1).max(32),
    preferredTimeFormat: timeFormatSchema,
    theme: themePreferenceSchema,
  })
  .partial();

/** Preferences page — every personalization field is individually optional. */
export const preferencesUpdateSchema = z
  .object({
    displayName: displayName,
    timezone: z.string().min(1).max(64),
    locale: z.string().min(2).max(35),
    language: z.string().min(2).max(35),
    preferredCurrency: z.string().length(3),
    preferredDateFormat: z.string().min(1).max(32),
    preferredTimeFormat: timeFormatSchema,
    theme: themePreferenceSchema,
    compactMode: z.boolean(),
    reducedMotion: z.boolean(),
    sidebarCollapsed: z.boolean(),
    sidebarWidth: z.number().int().min(180).max(400),
    defaultLandingPage: z.string().min(1).max(64),
    defaultFocusDuration: z.number().int().min(5).max(180),
    preferredStartOfDay: timeOfDay,
    preferredEndOfDay: timeOfDay,
    notificationSoundEnabled: z.boolean(),
    desktopNotificationsEnabled: z.boolean(),
    mobileNotificationsEnabled: z.boolean(),
    autoLaunchMorningBriefing: z.boolean(),
  })
  .partial();

/** Minimal first-login flow. */
export const onboardingSchema = z.object({
  displayName: displayName,
  timezone: z.string().min(1).max(64),
  theme: themePreferenceSchema,
  preferredStartOfDay: timeOfDay,
  preferredEndOfDay: timeOfDay,
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdate = z.infer<typeof preferencesUpdateSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
