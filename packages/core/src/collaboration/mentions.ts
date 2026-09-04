import { MENTION_PATTERN } from "./constants";
import type { Collaborator } from "./types";

/**
 * Mentions (Stage 7). Pure `@handle` extraction, resolved against a roster of the people
 * who can actually be mentioned (a shared context's members). Resolving against a roster —
 * rather than free text — means a mention only ever notifies a real, authorized person,
 * and never leaks names of people outside the shared context.
 */

/** A handle derived from a collaborator's name (lowercased first token, non-word stripped). */
export function handleFor(collaborator: Pick<Collaborator, "name">): string {
  const first = collaborator.name.trim().split(/\s+/)[0] ?? "";
  return first.toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

/** Extract raw `@handles` from a body (deduped, lowercased). */
export function extractHandles(body: string): string[] {
  const out = new Set<string>();
  for (const match of body.matchAll(MENTION_PATTERN)) {
    const handle = match[2]?.toLowerCase();
    if (handle) out.add(handle);
  }
  return [...out];
}

/**
 * Resolve the collaborator ids mentioned in a body, restricted to `roster`. Ambiguous
 * handles (two people share a first name) resolve to all matches — the server can decide
 * to notify all or none; here we return the set deterministically.
 */
export function resolveMentions(body: string, roster: readonly Collaborator[]): string[] {
  const handles = new Set(extractHandles(body));
  if (handles.size === 0) return [];
  const ids = new Set<string>();
  for (const c of roster) {
    if (handles.has(handleFor(c))) ids.add(c.id);
  }
  return [...ids];
}
