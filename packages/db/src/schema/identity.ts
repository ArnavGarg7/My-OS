/**
 * Identity schema (Sprint 1.5) — 05_Database_Design.md §1 (adapted).
 *
 * Deliberately minimal per the Sprint 1.5 decision: `auth_users` holds ONLY the
 * identity link (whichever provider is in use — Clerk today, swappable later)
 * and the authorization role. It intentionally does NOT mirror the provider's
 * user record. Everything else about the person — display name, locale, theme,
 * all preferences — lives in `user_preferences`, of which the DB is the source
 * of truth. To migrate off Clerk, replace `clerk_id` with a local auth id; no
 * other table changes.
 */
import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Authorization roles. Single-user today; `owner` only, future-proofed. */
export const userRole = pgEnum("user_role", ["owner"]);

/** Theme preference. Mirrors the design-system ThemeProvider modes. */
export const themePreference = pgEnum("theme_preference", ["light", "dark", "system"]);

/** Clock format for time display. */
export const timeFormat = pgEnum("time_format", ["12h", "24h"]);

/**
 * Identity anchor. One row per person, keyed by the external auth id. Nothing
 * here is provider-specific except `clerk_id`, which is the single swap point.
 */
export const authUsers = pgTable("auth_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  role: userRole("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * User preferences — the app's source of truth for identity presentation and
 * all personalization. One-to-one with `auth_users` (PK = user_id). New
 * preference fields are added here, never on `auth_users`.
 */
export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),

  // Identity presentation (source of truth = DB, not the auth provider)
  displayName: text("display_name"),

  // Localization
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  locale: text("locale").notNull().default("en-IN"),
  language: text("language").notNull().default("en"),
  preferredCurrency: text("preferred_currency").notNull().default("INR"),
  preferredDateFormat: text("preferred_date_format").notNull().default("dd MMM yyyy"),
  preferredTimeFormat: timeFormat("preferred_time_format").notNull().default("12h"),

  // Appearance
  theme: themePreference("theme").notNull().default("dark"),
  compactMode: boolean("compact_mode").notNull().default(false),
  reducedMotion: boolean("reduced_motion").notNull().default(false),

  // Shell / layout defaults
  sidebarCollapsed: boolean("sidebar_collapsed").notNull().default(false),
  sidebarWidth: integer("sidebar_width").notNull().default(236),
  defaultLandingPage: text("default_landing_page").notNull().default("/today"),

  // Daily rhythm
  defaultFocusDuration: integer("default_focus_duration").notNull().default(25), // minutes
  preferredStartOfDay: text("preferred_start_of_day").notNull().default("06:00"), // HH:mm
  preferredEndOfDay: text("preferred_end_of_day").notNull().default("22:00"), // HH:mm

  // Notifications (infrastructure flags only — no delivery in this sprint)
  notificationSoundEnabled: boolean("notification_sound_enabled").notNull().default(true),
  desktopNotificationsEnabled: boolean("desktop_notifications_enabled").notNull().default(false),
  mobileNotificationsEnabled: boolean("mobile_notifications_enabled").notNull().default(false),
  autoLaunchMorningBriefing: boolean("auto_launch_morning_briefing").notNull().default(false),

  // Onboarding — null until the first-login flow completes
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authUsersRelations = relations(authUsers, ({ one }) => ({
  preferences: one(userPreferences, {
    fields: [authUsers.id],
    references: [userPreferences.userId],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(authUsers, {
    fields: [userPreferences.userId],
    references: [authUsers.id],
  }),
}));

export type AuthUser = typeof authUsers.$inferSelect;
export type NewAuthUser = typeof authUsers.$inferInsert;
export type UserPreferencesRow = typeof userPreferences.$inferSelect;
export type NewUserPreferencesRow = typeof userPreferences.$inferInsert;
