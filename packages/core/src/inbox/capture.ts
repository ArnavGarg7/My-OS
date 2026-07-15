import { DERIVED_TITLE_MAX } from "./constants";
import type { CaptureInput, InboxItem } from "./types";

/**
 * Capture helpers (Sprint 2.4). Pure. Turns raw input into a normalized, not-yet
 * persisted InboxItem and provides the deterministic fingerprints used for
 * duplicate detection.
 */

/** Deterministic djb2 string hash (hex). No crypto — stable across runs. */
export function contentHash(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(16);
}

/** Normalize a URL for comparison (strip protocol, trailing slash, lowercase host). */
export function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

/** Extract the first URL found in a string, if any. */
export function extractUrl(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

/** Derive a human title from the content when none is supplied. */
export function deriveTitle(input: CaptureInput): string {
  const explicit = input.title?.trim();
  if (explicit) return explicit.slice(0, DERIVED_TITLE_MAX);

  const firstLine = input.content.trim().split("\n")[0]?.trim() ?? "";
  if (firstLine) {
    return firstLine.length > DERIVED_TITLE_MAX
      ? `${firstLine.slice(0, DERIVED_TITLE_MAX - 1).trimEnd()}…`
      : firstLine;
  }
  return "Untitled capture";
}

/**
 * Build a normalized InboxItem from raw input. The item is `new`, unpersisted
 * (id ""), and stamped with the capture time. Its fingerprints (contentHash and,
 * for links, url) are stored in metadata so duplicate detection stays pure.
 */
export function createCaptureItem(input: CaptureInput, now: Date): InboxItem {
  const iso = now.toISOString();
  const content = input.content.trim();
  const embedded = extractUrl(content);
  const url =
    input.type === "url" ? normalizeUrl(content) : embedded ? normalizeUrl(embedded) : undefined;

  const metadata: Record<string, unknown> = {
    ...(input.metadata ?? {}),
    contentHash: contentHash(content),
  };
  if (url) metadata["url"] = url;

  return {
    id: "",
    type: input.type,
    title: deriveTitle(input),
    content,
    metadata,
    status: "new",
    source: input.source,
    capturedAt: iso,
    organizedAt: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: iso,
    updatedAt: iso,
  };
}
