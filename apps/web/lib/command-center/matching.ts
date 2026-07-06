import type { Command } from "./types";

/**
 * Command matching (Sprint 1.6). Deliberately simple, case-insensitive
 * `contains()` over title / subtitle / keywords / category. No fuzzy ranking,
 * no embeddings, no semantic search — that is a later sprint.
 */

export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

/** Does a command match the query via substring on any searchable field? */
export function matchesQuery(command: Command, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  const haystacks = [
    command.title,
    command.subtitle ?? "",
    command.category,
    ...(command.keywords ?? []),
  ];
  return haystacks.some((field) => field.toLowerCase().includes(q));
}

/** Filter commands by the query, preserving their incoming order. */
export function filterCommands(commands: Command[], query: string): Command[] {
  const q = normalizeQuery(query);
  if (!q) return commands;
  return commands.filter((command) => matchesQuery(command, q));
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Split `text` into segments marking the first case-insensitive match of `query`. */
export function highlightMatch(text: string, query: string): HighlightSegment[] {
  const q = normalizeQuery(query);
  if (!q) return [{ text, match: false }];
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return [{ text, match: false }];

  const segments: HighlightSegment[] = [];
  if (index > 0) segments.push({ text: text.slice(0, index), match: false });
  segments.push({ text: text.slice(index, index + q.length), match: true });
  if (index + q.length < text.length) {
    segments.push({ text: text.slice(index + q.length), match: false });
  }
  return segments;
}
