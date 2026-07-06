/**
 * Identity domain types (Sprint 1.5). Provider-agnostic DTOs — the shape the
 * rest of the app consumes. Nothing here mentions Clerk; swapping the auth
 * backend must not change these types.
 */

export type UserRole = "owner";
export type ThemePreference = "light" | "dark" | "system";
export type TimeFormat = "12h" | "24h";

/** The app's source-of-truth preferences (from `user_preferences`). */
export interface UserPreferences {
  displayName: string | null;
  timezone: string;
  locale: string;
  language: string;
  preferredCurrency: string;
  preferredDateFormat: string;
  preferredTimeFormat: TimeFormat;
  theme: ThemePreference;
  compactMode: boolean;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  defaultLandingPage: string;
  defaultFocusDuration: number;
  preferredStartOfDay: string;
  preferredEndOfDay: string;
  notificationSoundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  mobileNotificationsEnabled: boolean;
  autoLaunchMorningBriefing: boolean;
}

/** Read-only identity facts sourced from the auth provider (not persisted). */
export interface ProviderIdentity {
  email: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
}

/** The merged identity: internal id + role + provider facts + DB preferences. */
export interface Identity {
  id: string;
  role: UserRole;
  email: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  isOnboarded: boolean;
  preferences: UserPreferences;
}

// Mutation input DTOs (ProfileUpdate / PreferencesUpdate / OnboardingInput) are
// derived from the zod schemas in ./schemas so validation and types never drift.
