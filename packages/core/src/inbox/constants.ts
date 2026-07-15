/**
 * Universal Inbox constants (Sprint 2.4). The Inbox is a capture system, not a
 * task list — everything enters here first and nothing is auto-categorized.
 * Deterministic: no AI, no randomness.
 */

export const CAPTURE_TYPES = [
  "text",
  "task",
  "note",
  "idea",
  "decision_note",
  "meeting",
  "url",
  "image",
  "pdf",
  "voice",
  "file",
  "journal",
  "clipboard",
] as const;
export type CaptureType = (typeof CAPTURE_TYPES)[number];

export const CAPTURE_STATUSES = ["new", "organized", "archived", "deleted"] as const;
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number];

export const CAPTURE_SOURCES = [
  "quick_add",
  "command_center",
  "share",
  "manual",
  "import",
  "drag_drop",
  "paste",
] as const;
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];

/** Suggested destinations (suggestions only — nothing ever moves automatically). */
export const DESTINATIONS = [
  "Projects",
  "Journal",
  "Health",
  "Planner",
  "College",
  "Internship",
  "Finance",
  "Goals",
  "Decision",
  "General Notes",
] as const;
export type Destination = (typeof DESTINATIONS)[number];

/** Duplicate detection only considers captures within this window. */
export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Above this many `new` items, the Decision Engine suggests processing the Inbox. */
export const DEFAULT_INBOX_OVERFLOW_THRESHOLD = 10;

/** Default number of days after which auto-archive would apply (infrastructure). */
export const DEFAULT_AUTO_ARCHIVE_DAYS = 30;

/** Length a derived title is truncated to. */
export const DERIVED_TITLE_MAX = 80;
