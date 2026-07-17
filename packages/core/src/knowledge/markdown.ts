/**
 * Markdown structure helpers (Sprint 4.1). Pure, deterministic parsing of the markdown
 * features the Notes/Wiki editors support — headings, code blocks, tables, callouts,
 * checklists — without rendering. Rendering is the UI's job (reuse the design system).
 */

export interface Heading {
  level: number; // 1..6
  text: string;
}

/** Extract ATX headings (`# ...`), ignoring headings inside fenced code blocks. */
export function headings(markdown: string): Heading[] {
  const out: Heading[] = [];
  let inFence = false;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (/^```/.test(line.trimStart())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+)$/.exec(line.trimStart());
    if (m) out.push({ level: m[1]!.length, text: m[2]!.trim() });
  }
  return out;
}

/** The first `# ` heading, or the first non-empty line, or "". */
export function inferTitle(markdown: string): string {
  const h1 = headings(markdown).find((h) => h.level === 1);
  if (h1) return h1.text;
  const firstLine = markdown.split(/\r?\n/).find((l) => l.trim().length > 0);
  return firstLine?.trim().replace(/^#+\s*/, "") ?? "";
}

/** Count fenced code blocks. */
export function codeBlockCount(markdown: string): number {
  const fences = (markdown.match(/^```/gm) ?? []).length;
  return Math.floor(fences / 2);
}

/** Whether the markdown contains a GFM table (a `---|---` separator row). */
export function hasTable(markdown: string): boolean {
  return (
    /^\s*\|?[\s:-]*-{3,}[\s:|-]*\|/m.test(markdown) || /\|.*\|\s*\n\s*\|?[-:| ]+\|/.test(markdown)
  );
}

export interface Checklist {
  total: number;
  done: number;
}

/** Count `- [ ]` / `- [x]` task-list items. */
export function checklist(markdown: string): Checklist {
  const items = markdown.match(/^\s*[-*]\s+\[[ xX]\]/gm) ?? [];
  const done = markdown.match(/^\s*[-*]\s+\[[xX]\]/gm) ?? [];
  return { total: items.length, done: done.length };
}

/** Extract callout kinds (`> [!note]`, `> [!warning]`, …). */
export function callouts(markdown: string): string[] {
  const out: string[] = [];
  const re = /^>\s*\[!(\w+)\]/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) out.push(m[1]!.toLowerCase());
  return out;
}

/** Plain-text approximation: strip fences, markers and wiki/link syntax. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A short snippet around the first occurrence of `term` (case-insensitive). */
export function snippet(markdown: string, term: string, radius = 60): string {
  const text = toPlainText(markdown);
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2).trim();
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + term.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}
