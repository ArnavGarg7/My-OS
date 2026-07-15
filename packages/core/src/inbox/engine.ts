import { DUPLICATE_WINDOW_MS } from "./constants";
import { createCaptureItem } from "./capture";
import type { Destination } from "./constants";
import type {
  CaptureInput,
  CaptureResult,
  DuplicateMatch,
  InboxFilter,
  InboxItem,
  InboxSort,
  SearchQuery,
} from "./types";

/**
 * InboxEngine (Sprint 2.4). Pure, deterministic operations over InboxItems. The
 * engine never persists, never moves items on its own, and never auto-deletes
 * duplicates — it only computes the next immutable state or surfaces suggestions.
 */
export class InboxEngine {
  /** Build a new capture and detect possible duplicates against existing items. */
  capture(input: CaptureInput, now: Date, existing: InboxItem[] = []): CaptureResult {
    const item = createCaptureItem(input, now);
    return { item, duplicates: this.findDuplicates(item, existing) };
  }

  archive(item: InboxItem, now: Date): InboxItem {
    return touch({ ...item, status: "archived", archivedAt: now.toISOString() }, now);
  }

  delete(item: InboxItem, now: Date): InboxItem {
    return touch({ ...item, status: "deleted", deletedAt: now.toISOString() }, now);
  }

  /** Bring an archived/deleted item back to the inbox. */
  restore(item: InboxItem, now: Date): InboxItem {
    return touch(
      { ...item, status: "new", archivedAt: null, deletedAt: null, organizedAt: null },
      now,
    );
  }

  /** Mark an item organized toward a destination (a record — nothing moves). */
  organize(item: InboxItem, destination: Destination, now: Date): InboxItem {
    return touch(
      {
        ...item,
        status: "organized",
        organizedAt: now.toISOString(),
        metadata: { ...item.metadata, destination },
      },
      now,
    );
  }

  /** Clone an item as a fresh unpersisted capture. */
  duplicate(item: InboxItem, now: Date): InboxItem {
    return createCaptureItem(
      {
        type: item.type,
        title: item.title,
        content: item.content,
        source: "manual",
        metadata: item.metadata,
      },
      now,
    );
  }

  /** Merge others into a primary item; returns the combined primary (unpersisted others are the caller's concern). */
  merge(primary: InboxItem, others: InboxItem[], now: Date): InboxItem {
    const parts = [primary.content, ...others.map((o) => o.content)].filter(Boolean);
    const mergedMeta = others.reduce<Record<string, unknown>>(
      (acc, o) => ({ ...acc, ...o.metadata }),
      { ...primary.metadata },
    );
    return touch(
      {
        ...primary,
        content: parts.join("\n\n---\n\n"),
        metadata: { ...mergedMeta, mergedFrom: others.map((o) => o.id).filter(Boolean) },
      },
      now,
    );
  }

  /** Possible duplicates within the capture window: same title, content, or url. */
  findDuplicates(
    candidate: InboxItem,
    existing: InboxItem[],
    windowMs: number = DUPLICATE_WINDOW_MS,
  ): DuplicateMatch[] {
    const at = new Date(candidate.capturedAt).getTime();
    const title = candidate.title.trim().toLowerCase();
    const hash = candidate.metadata["contentHash"];
    const url = candidate.metadata["url"];
    const matches: DuplicateMatch[] = [];

    for (const other of existing) {
      if (!other.id || other.status === "deleted") continue;
      const delta = Math.abs(new Date(other.capturedAt).getTime() - at);
      if (delta > windowMs) continue;

      if (url && other.metadata["url"] === url) {
        matches.push({ itemId: other.id, reason: "same url" });
      } else if (hash && other.metadata["contentHash"] === hash) {
        matches.push({ itemId: other.id, reason: "same content" });
      } else if (title && other.title.trim().toLowerCase() === title) {
        matches.push({ itemId: other.id, reason: "same title" });
      }
    }
    return matches;
  }

  /** Deterministic search. No vectors, no embeddings — plain field matching. */
  search(items: InboxItem[], query: SearchQuery): InboxItem[] {
    const text = query.text?.trim().toLowerCase();
    const keywords = (query.keywords ?? []).map((k) => k.toLowerCase()).filter(Boolean);
    const from = query.from ? new Date(query.from).getTime() : null;
    const to = query.to ? new Date(query.to).getTime() : null;

    const scored = items
      .filter((item) => {
        if (query.type && item.type !== query.type) return false;
        if (query.status && item.status !== query.status) return false;
        const at = new Date(item.capturedAt).getTime();
        if (from !== null && at < from) return false;
        if (to !== null && at > to) return false;
        const hay = `${item.title}\n${item.content}`.toLowerCase();
        if (text && !hay.includes(text)) return false;
        if (keywords.length > 0 && !keywords.every((k) => hay.includes(k))) return false;
        return true;
      })
      .map((item) => ({ item, score: relevance(item, text) }));

    return scored
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.item.capturedAt).getTime() - new Date(a.item.capturedAt).getTime(),
      )
      .map((s) => s.item);
  }

  /** Non-text list filtering + sorting. */
  filter(items: InboxItem[], filter: InboxFilter, sort: InboxSort = "newest"): InboxItem[] {
    const filtered = items.filter(
      (item) =>
        (!filter.status || item.status === filter.status) &&
        (!filter.type || item.type === filter.type),
    );
    return sortItems(filtered, sort);
  }
}

/** Bump updatedAt on every transition. */
function touch(item: InboxItem, now: Date): InboxItem {
  return { ...item, updatedAt: now.toISOString() };
}

function relevance(item: InboxItem, text: string | undefined): number {
  if (!text) return 0;
  let score = 0;
  if (item.title.toLowerCase().includes(text)) score += 10;
  if (item.content.toLowerCase().includes(text)) score += 4;
  return score;
}

export function sortItems(items: InboxItem[], sort: InboxSort): InboxItem[] {
  const copy = [...items];
  if (sort === "title") return copy.sort((a, b) => a.title.localeCompare(b.title));
  copy.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
  return sort === "newest" ? copy.reverse() : copy;
}

/** Shared singleton — the engine is stateless. */
export const inboxEngine = new InboxEngine();
