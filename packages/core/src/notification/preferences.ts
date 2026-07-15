import { NOTIFICATION_TYPES, type NotificationType } from "./constants";
import { defaultQuietHours } from "./quiet-hours";
import type { CategoryPreference, NotificationPreferences } from "./types";

/**
 * Notification preferences (Sprint 3.3). Pure defaults + per-category resolution.
 * Preferences gate delivery per category, plus global working-hours/weekend/quiet-
 * hours/mute rules. Deterministic — no side effects.
 */
export function defaultCategoryPreference(type: NotificationType): CategoryPreference {
  // System + critical-ish categories default louder; informational default quieter.
  const loud = type === "system" || type === "finance" || type === "calendar";
  return {
    type,
    enabled: true,
    desktop: loud,
    push: type === "calendar" || type === "finance",
    sound: type === "calendar",
    banner: true,
    persistent: type === "system",
  };
}

export function defaultPreferences(): NotificationPreferences {
  return {
    quietHours: defaultQuietHours(),
    workingHoursOnly: false,
    weekendSuppression: false,
    muted: false,
    categories: NOTIFICATION_TYPES.map(defaultCategoryPreference),
  };
}

/** Look up the preference for a category, falling back to a default. */
export function categoryPreference(
  prefs: NotificationPreferences,
  type: NotificationType,
): CategoryPreference {
  return prefs.categories.find((c) => c.type === type) ?? defaultCategoryPreference(type);
}

/** Whether a category is enabled at all. */
export function isCategoryEnabled(prefs: NotificationPreferences, type: NotificationType): boolean {
  return categoryPreference(prefs, type).enabled;
}

/** Merge a partial category update into full preferences (immutable). */
export function updateCategory(
  prefs: NotificationPreferences,
  type: NotificationType,
  patch: Partial<Omit<CategoryPreference, "type">>,
): NotificationPreferences {
  const exists = prefs.categories.some((c) => c.type === type);
  const categories = exists
    ? prefs.categories.map((c) => (c.type === type ? { ...c, ...patch } : c))
    : [...prefs.categories, { ...defaultCategoryPreference(type), ...patch }];
  return { ...prefs, categories };
}

/** Is `now` a weekend day in the given timezone? */
export function isWeekend(now: Date, timezone: string): boolean {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(
    now,
  );
  return day === "Sat" || day === "Sun";
}
