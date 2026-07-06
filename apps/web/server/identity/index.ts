/**
 * Identity layer public surface (Sprint 1.5). Import identity operations from
 * here — never `@clerk/*` directly. Clerk lives only in `./clerk`, guarded by
 * `./config` and consumed by `./service`.
 */
export {
  getCurrentUser,
  requireUser,
  getPreferences,
  updateProfile,
  updatePreferences,
  completeOnboarding,
} from "./service";
export { clerkEnabled, signInUrl } from "./config";
export type { ProfileUpdate, PreferencesUpdate, OnboardingInput } from "./schemas";
export type { Identity, UserPreferences, UserRole, ThemePreference, TimeFormat } from "./types";
