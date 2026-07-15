import type { CaptureSource, CaptureStatus, CaptureType, Destination } from "./constants";

/**
 * Inbox domain types (Sprint 2.4). An InboxItem is any captured piece of
 * information. It carries a lifecycle (new → organized/archived/deleted) but the
 * Inbox never decides what it is — organization is always a suggestion.
 */
export interface InboxItem {
  /** Persistence id; "" for a not-yet-persisted capture. */
  id: string;
  type: CaptureType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  status: CaptureStatus;
  source: CaptureSource;
  capturedAt: string; // ISO
  organizedAt: string | null; // ISO
  archivedAt: string | null; // ISO
  deletedAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** What a caller provides to capture something. */
export interface CaptureInput {
  type: CaptureType;
  title?: string | null;
  content: string;
  source: CaptureSource;
  metadata?: Record<string, unknown>;
}

/** A detected possible duplicate (never auto-deleted). */
export interface DuplicateMatch {
  itemId: string;
  reason: "same title" | "same content" | "same url";
}

/** The result of a capture: the built item plus any possible duplicates. */
export interface CaptureResult {
  item: InboxItem;
  duplicates: DuplicateMatch[];
}

/** A ranked, deterministic destination suggestion. */
export interface DestinationSuggestion {
  destination: Destination;
  confidence: number; // 0–100
  reason: string;
  matched: string[];
}

/** Deterministic search query. No vectors, no embeddings. */
export interface SearchQuery {
  text?: string | undefined;
  type?: CaptureType | undefined;
  status?: CaptureStatus | undefined;
  /** Inclusive ISO date bounds on capturedAt. */
  from?: string | undefined;
  to?: string | undefined;
  keywords?: string[] | undefined;
}

/** Non-text list filter. */
export interface InboxFilter {
  status?: CaptureStatus | undefined;
  type?: CaptureType | undefined;
}

export type InboxSort = "newest" | "oldest" | "title";
