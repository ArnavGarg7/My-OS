/** Product identity — docs/specs/01_Vision.md §6. */
export const APP_NAME = "My OS" as const;
export const APP_TAGLINE = "The Operating System for My Life." as const;

/** Application version — surfaced in the profile page + status bar. Keep in sync with package.json. */
export const APP_VERSION = "1.0.0" as const;

/** Default timezone — 02_PRD §1 (user-configurable). */
export const DEFAULT_TIMEZONE = "Asia/Kolkata" as const;

/** Localization defaults — 02_PRD §1 / §15 (currency INR). */
export const DEFAULT_LOCALE = "en-IN" as const;
export const DEFAULT_CURRENCY = "INR" as const;

/** Origin of a content row — 02_PRD §2.6 / docs/specs/05_Database_Design.md §0. */
export const ORIGINS = ["user", "ai", "automation", "import", "system"] as const;
export type Origin = (typeof ORIGINS)[number];
