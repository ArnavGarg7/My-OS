/**
 * Curated option lists for the identity/preferences forms (Sprint 1.5). Small,
 * practical subsets — not exhaustive IANA/ISO tables — sufficient for a personal
 * OS. Values are the canonical strings stored in `user_preferences`.
 */

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

export const LOCALES: { value: string; label: string }[] = [
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "hi-IN", label: "Hindi (India)" },
];

export const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY"] as const;

export const DATE_FORMATS: { value: string; label: string }[] = [
  { value: "dd MMM yyyy", label: "05 Jul 2026" },
  { value: "MMM d, yyyy", label: "Jul 5, 2026" },
  { value: "dd/MM/yyyy", label: "05/07/2026" },
  { value: "MM/dd/yyyy", label: "07/05/2026" },
  { value: "yyyy-MM-dd", label: "2026-07-05" },
];

export const THEMES: { value: "light" | "dark" | "system"; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const TIME_FORMATS: { value: "12h" | "24h"; label: string }[] = [
  { value: "12h", label: "12-hour (2:30 PM)" },
  { value: "24h", label: "24-hour (14:30)" },
];

/** Landing pages a user may choose to open on load. Mirrors the shell nav. */
export const LANDING_PAGES: { value: string; label: string }[] = [
  { value: "/today", label: "Today" },
  { value: "/planner", label: "Planner" },
  { value: "/inbox", label: "Inbox" },
  { value: "/projects", label: "Projects" },
  { value: "/goals", label: "Goals" },
];
