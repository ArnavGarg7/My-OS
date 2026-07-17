import {
  FORGOTTEN_NOTE_DAYS,
  RECENTLY_LINKED_DAYS,
  RESURFACE_WEIGHTS,
  STALE_RESEARCH_DAYS,
  UNOPENED_BOOK_DAYS,
} from "./constants";
import type { Book, Note, ResearchProject, ResurfacedItem, WikiPage } from "./types";
import { incomingCounts, type LinkableEntity } from "./backlinks";

/**
 * Memory resurfacing (Sprint 4.1). Every morning, deterministically rank knowledge worth
 * revisiting — forgotten notes, stale research, unopened books, important wiki pages,
 * recently-linked concepts. PURE ranking from fixed weights + age; NO embeddings, NO
 * randomness. Phase 5 will layer semantic relevance on top of this stable base.
 */

export interface ResurfaceInput {
  notes: Note[];
  wiki: WikiPage[];
  books: Book[];
  research: ResearchProject[];
  now: Date;
}

function ageDays(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / 86_400_000;
}

export function resurface(input: ResurfaceInput, limit = 6): ResurfacedItem[] {
  const { notes, wiki, books, research, now } = input;
  const items: ResurfacedItem[] = [];

  // Incoming-link counts across notes + wiki (for "important wiki" + "recently linked").
  const linkables: LinkableEntity[] = [
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      linkedTitles: n.linkedTitles,
    })),
    ...wiki.map((w) => ({
      id: w.id,
      type: "wiki" as const,
      title: w.title,
      linkedTitles: w.linkedTitles,
    })),
  ];
  const incoming = incomingCounts(linkables);

  // Forgotten notes: not touched in a long time.
  for (const n of notes) {
    if (n.archived) continue;
    const age = ageDays(n.updatedAt, now);
    if (age >= FORGOTTEN_NOTE_DAYS) {
      items.push({
        id: n.id,
        type: "note",
        title: n.title,
        reason: "forgotten_knowledge",
        detail: `Not opened in ${Math.round(age)} days`,
        score: RESURFACE_WEIGHTS.forgotten_knowledge + Math.min(20, Math.round(age / 10)),
      });
    } else if (age <= RECENTLY_LINKED_DAYS && (incoming.get(n.id) ?? 0) > 0) {
      items.push({
        id: n.id,
        type: "note",
        title: n.title,
        reason: "recently_linked",
        detail: `Linked from ${incoming.get(n.id)} place(s)`,
        score: RESURFACE_WEIGHTS.recently_linked + (incoming.get(n.id) ?? 0),
      });
    }
  }

  // Important wiki pages: highest incoming-link count.
  const importantWiki = [...wiki]
    .map((w) => ({ w, deg: incoming.get(w.id) ?? 0 }))
    .filter((x) => x.deg > 0)
    .sort((a, b) => b.deg - a.deg)
    .slice(0, 3);
  for (const { w, deg } of importantWiki) {
    items.push({
      id: w.id,
      type: "wiki",
      title: w.title,
      reason: "important_wiki",
      detail: `${deg} incoming link(s)`,
      score: RESURFACE_WEIGHTS.important_wiki + deg,
    });
  }

  // Stale research: in-progress but idle.
  for (const r of research) {
    if (r.status !== "in_progress") continue;
    const age = ageDays(r.updatedAt, now);
    if (age >= STALE_RESEARCH_DAYS) {
      items.push({
        id: r.id,
        type: "research",
        title: r.title,
        reason: "stale_research",
        detail: `Idle ${Math.round(age)} days`,
        score: RESURFACE_WEIGHTS.stale_research + Math.min(15, Math.round(age / 5)),
      });
    }
  }

  // Unopened books: want-to-read or reading, untouched.
  for (const b of books) {
    if (b.status !== "reading" && b.status !== "want_to_read") continue;
    const age = ageDays(b.updatedAt, now);
    if (age >= UNOPENED_BOOK_DAYS) {
      items.push({
        id: b.id,
        type: "book",
        title: b.title,
        reason: "unopened_book",
        detail: `Untouched ${Math.round(age)} days`,
        score: RESURFACE_WEIGHTS.unopened_book + Math.min(15, Math.round(age / 7)),
      });
    }
  }

  // Deterministic order: score desc, then title asc; dedupe by id keeping best.
  const best = new Map<string, ResurfacedItem>();
  for (const item of items) {
    const existing = best.get(item.id);
    if (!existing || item.score > existing.score) best.set(item.id, item);
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
