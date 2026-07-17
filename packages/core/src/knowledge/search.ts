import { SEARCH_WEIGHTS } from "./constants";
import type { KnowledgeType } from "./constants";
import type { Book, Course, Note, ResearchProject, SearchHit, WikiPage } from "./types";
import { headings, snippet, toPlainText } from "./markdown";
import { normalizeTitle } from "./wiki";

/**
 * Knowledge search (Sprint 4.1). PURE deterministic ranking — NO vectors, NO semantic
 * search. A query is scored against each entity with fixed weight bands (exact title >
 * wiki title > heading > tag > body > reference > recent), and ties broken by recency.
 * Phase 5's AI layer will add semantics on top; this is the reproducible substrate.
 */

export interface SearchCollections {
  notes: Note[];
  wiki: WikiPage[];
  books: Book[];
  courses: Course[];
  research: ResearchProject[];
}

interface Scored {
  hit: SearchHit;
  updatedAt: number;
}

function recencyBonus(updatedAt: string, now: Date): number {
  const days = (now.getTime() - new Date(updatedAt).getTime()) / 86_400_000;
  if (days <= 7) return SEARCH_WEIGHTS.recent;
  if (days <= 30) return Math.round(SEARCH_WEIGHTS.recent / 2);
  return 0;
}

function scoreText(
  q: string,
  opts: {
    title: string;
    body?: string;
    tags?: string[];
    headings?: string[];
    references?: string[];
    isWiki?: boolean;
  },
): { score: number; reason: string } {
  const nq = normalizeTitle(q);
  const title = normalizeTitle(opts.title);
  let score = 0;
  let reason = "";

  if (title === nq) {
    score += SEARCH_WEIGHTS.exactTitle;
    reason = "Exact title";
  } else if (title.includes(nq)) {
    score += opts.isWiki ? SEARCH_WEIGHTS.wikiTitle : SEARCH_WEIGHTS.wikiTitle - 50;
    reason = opts.isWiki ? "Wiki title" : "Title";
  }

  if ((opts.headings ?? []).some((h) => normalizeTitle(h).includes(nq))) {
    score += SEARCH_WEIGHTS.heading;
    reason ||= "Heading";
  }
  if ((opts.tags ?? []).some((t) => t.toLowerCase().includes(q.toLowerCase()))) {
    score += SEARCH_WEIGHTS.tag;
    reason ||= "Tag";
  }
  if (opts.body && toPlainText(opts.body).toLowerCase().includes(q.toLowerCase())) {
    score += SEARCH_WEIGHTS.body;
    reason ||= "Body";
  }
  if ((opts.references ?? []).some((r) => r.toLowerCase().includes(q.toLowerCase()))) {
    score += SEARCH_WEIGHTS.reference;
    reason ||= "Reference";
  }
  return { score, reason };
}

export function search(
  query: string,
  collections: SearchCollections,
  now: Date,
  limit = 20,
): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const scored: Scored[] = [];

  const push = (
    entity: { id: string; title: string; updatedAt: string },
    type: KnowledgeType,
    base: { score: number; reason: string },
    body: string,
  ) => {
    if (base.score <= 0) return;
    const score = base.score + recencyBonus(entity.updatedAt, now);
    scored.push({
      hit: {
        id: entity.id,
        type,
        title: entity.title,
        snippet: snippet(body, q),
        score,
        reason: base.reason,
      },
      updatedAt: new Date(entity.updatedAt).getTime(),
    });
  };

  for (const n of collections.notes) {
    if (n.archived) continue;
    push(
      n,
      "note",
      scoreText(q, {
        title: n.title,
        body: n.content,
        tags: n.tags,
        headings: headings(n.content).map((h) => h.text),
        references: n.linkedTitles,
      }),
      n.content,
    );
  }
  for (const w of collections.wiki) {
    push(
      w,
      "wiki",
      scoreText(q, {
        title: w.title,
        body: w.content,
        tags: w.tags,
        headings: headings(w.content).map((h) => h.text),
        references: w.linkedTitles,
        isWiki: true,
      }),
      w.content,
    );
  }
  for (const b of collections.books) {
    push(b, "book", scoreText(q, { title: b.title, body: `${b.author} ${b.notes}` }), b.notes);
  }
  for (const c of collections.courses) {
    push(c, "course", scoreText(q, { title: c.title, body: `${c.provider} ${c.notes}` }), c.notes);
  }
  for (const r of collections.research) {
    push(
      r,
      "research",
      scoreText(q, {
        title: r.title,
        body: `${r.question} ${r.hypothesis} ${r.conclusions}`,
        references: r.sources,
      }),
      `${r.question} ${r.conclusions}`,
    );
  }

  return scored
    .sort((a, b) => b.hit.score - a.hit.score || b.updatedAt - a.updatedAt)
    .slice(0, limit)
    .map((s) => s.hit);
}
