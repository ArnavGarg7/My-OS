/**
 * Conversation citations (Sprint 5.3, 06_AI_Architecture §5). Every factual answer references the
 * deterministic sources it came from, so the user can inspect the supporting data. Citations are
 * derived from tool results — entity references (module + id), never invented. Pure.
 */

export interface Citation {
  /** The owning module (task, timeline, calendar, knowledge, resource, journal, planner…). */
  module: string;
  /** The entity id, or a query marker for aggregate results. */
  id: string;
  /** A short human label rendered as a chip. */
  label: string;
}

/** Build a citation from an entity reference. */
export function cite(module: string, id: string, label: string): Citation {
  return { module, id, label };
}

/** Deduplicate citations by module+id, preserving order. */
export function dedupeCitations(citations: readonly Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of citations) {
    const key = `${c.module}:${c.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}
