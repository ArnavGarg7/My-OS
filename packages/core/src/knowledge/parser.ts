import { normalizeTitle } from "./wiki";

/**
 * Knowledge parser (Sprint 4.1). Extracts the structured signals the platform links on:
 * wiki `[[targets]]`, `#tags`, and the plain-text body. Pure + deterministic — the same
 * input always yields the same links, so the graph and backlinks are reproducible.
 */

/** Extract wiki-link targets from `[[Target]]` / `[[Target|alias]]`. */
export function parseWikiLinks(markdown: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const title = m[1]!.trim();
    const key = normalizeTitle(title);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(title);
    }
  }
  return out;
}

/** Extract `#tags` (hashtags), excluding markdown headings and code. */
export function parseTags(markdown: string): string[] {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^#{1,6}\s.*$/gm, " "); // drop heading lines
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /(?:^|\s)#([a-z0-9][a-z0-9_-]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const tag = m[1]!.toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out;
}

/** Merge explicit tags with parsed hashtags (explicit first, deduped, lowercased). */
export function mergeTags(explicit: string[], markdown: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of [...explicit.map((t) => t.toLowerCase()), ...parseTags(markdown)]) {
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}
