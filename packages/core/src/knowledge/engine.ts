import { mergeTags, parseWikiLinks } from "./parser";
import { inferTitle } from "./markdown";
import { normalizeTitle, slugify } from "./wiki";
import { newCard, reviewCard } from "./flashcards";
import type { Flashcard, Note, WikiPage } from "./types";
import type { ReviewGrade } from "./constants";

/**
 * KnowledgeEngine (Sprint 4.1). The pure coordinator that turns raw markdown input into
 * structured knowledge entities — parsing wiki links + tags, inferring titles, minting
 * ids — and drives flashcard reviews. Ids + clock are injected for determinism; the
 * engine holds no persistence and no feature logic beyond composition.
 */
export interface KnowledgeEngineDeps {
  newId: () => string;
  now: () => Date;
}

export class KnowledgeEngine {
  constructor(private readonly deps: KnowledgeEngineDeps) {}

  private clock(): Date {
    return this.deps.now();
  }

  /** Build a note from a title + markdown body, parsing links + tags. */
  makeNote(input: { title?: string; content?: string; tags?: string[]; pinned?: boolean }): Note {
    const iso = this.clock().toISOString();
    const content = input.content ?? "";
    const title = (input.title?.trim() || inferTitle(content) || "Untitled").slice(0, 200);
    return {
      id: this.deps.newId(),
      title,
      content,
      tags: mergeTags(input.tags ?? [], content),
      linkedTitles: parseWikiLinks(content),
      archived: false,
      pinned: input.pinned ?? false,
      createdAt: iso,
      updatedAt: iso,
    };
  }

  /** Recompute a note's derived fields after an edit (links, tags, updatedAt). */
  reparseNote(note: Note, patch: Partial<Note>): Note {
    const content = patch.content ?? note.content;
    const explicitTags = patch.tags ?? note.tags;
    return {
      ...note,
      ...patch,
      content,
      tags: mergeTags(explicitTags, content),
      linkedTitles: parseWikiLinks(content),
      updatedAt: this.clock().toISOString(),
    };
  }

  /** Build a wiki page (title is identity; slug is derived). */
  makeWiki(input: { title: string; content?: string; tags?: string[] }): WikiPage {
    const iso = this.clock().toISOString();
    const content = input.content ?? "";
    const title = input.title.trim().slice(0, 200);
    return {
      id: this.deps.newId(),
      title,
      slug: slugify(title),
      content,
      tags: mergeTags(input.tags ?? [], content),
      linkedTitles: parseWikiLinks(content),
      createdAt: iso,
      updatedAt: iso,
    };
  }

  reparseWiki(page: WikiPage, patch: Partial<WikiPage>): WikiPage {
    const content = patch.content ?? page.content;
    const title = (patch.title ?? page.title).trim();
    return {
      ...page,
      ...patch,
      title,
      slug: slugify(title),
      content,
      tags: mergeTags(patch.tags ?? page.tags, content),
      linkedTitles: parseWikiLinks(content),
      updatedAt: this.clock().toISOString(),
    };
  }

  /** Mint a new flashcard due immediately. */
  makeCard(deckId: string, front: string, back: string): Flashcard {
    return newCard(this.deps.newId(), deckId, front, back, this.clock());
  }

  /** Apply a review grade to a card. */
  review(card: Flashcard, grade: ReviewGrade) {
    return reviewCard(card, grade, this.clock());
  }

  /** Whether two titles refer to the same wiki identity. */
  sameTitle(a: string, b: string): boolean {
    return normalizeTitle(a) === normalizeTitle(b);
  }
}

export function createKnowledgeEngine(
  newId: () => string,
  now: () => Date = () => new Date(),
): KnowledgeEngine {
  return new KnowledgeEngine({ newId, now });
}
