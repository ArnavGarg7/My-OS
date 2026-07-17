import type { KnowledgeType } from "./constants";
import type { Backlink, BacklinkView } from "./types";
import { normalizeTitle } from "./wiki";

/**
 * Backlinks (Sprint 4.1). Given the set of link-bearing entities, derive — for any one
 * of them — the pages that link TO it (incoming), the titles it links to that don't
 * exist yet (unresolved), and whether it is an orphan. Pure + deterministic.
 */

export interface LinkableEntity {
  id: string;
  type: KnowledgeType;
  title: string;
  linkedTitles: string[];
}

export function backlinksFor(target: LinkableEntity, all: LinkableEntity[]): BacklinkView {
  const targetKey = normalizeTitle(target.title);
  const known = new Set(all.map((e) => normalizeTitle(e.title)));

  const backlinks: Backlink[] = [];
  for (const e of all) {
    if (e.id === target.id) continue;
    if (e.linkedTitles.some((t) => normalizeTitle(t) === targetKey)) {
      backlinks.push({ fromId: e.id, fromType: e.type, fromTitle: e.title });
    }
  }
  backlinks.sort((a, b) => a.fromTitle.localeCompare(b.fromTitle));

  const unresolved = target.linkedTitles.filter((t) => !known.has(normalizeTitle(t)));
  const orphan = backlinks.length === 0 && target.linkedTitles.length === 0;

  return { backlinks, unresolved, orphan };
}

/** All entities that link to nothing and are linked to by nothing. */
export function orphans(all: LinkableEntity[]): LinkableEntity[] {
  const incoming = new Set<string>();
  for (const e of all) {
    for (const t of e.linkedTitles) incoming.add(normalizeTitle(t));
  }
  return all.filter((e) => e.linkedTitles.length === 0 && !incoming.has(normalizeTitle(e.title)));
}

/** Count of incoming links per entity id (for degree/most-connected). */
export function incomingCounts(all: LinkableEntity[]): Map<string, number> {
  const byTitle = new Map<string, string>(); // normalized title -> id
  for (const e of all) byTitle.set(normalizeTitle(e.title), e.id);
  const counts = new Map<string, number>();
  for (const e of all) counts.set(e.id, 0);
  for (const e of all) {
    for (const t of e.linkedTitles) {
      const id = byTitle.get(normalizeTitle(t));
      if (id && id !== e.id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}
