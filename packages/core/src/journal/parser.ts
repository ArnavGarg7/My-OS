import type { EntryType, MoodLevel } from "./constants";

/**
 * Journal quick-capture parser (Sprint 2.10). Deterministic extraction of tags
 * (#tag), an optional mood (/mood), and a title from a short capture. No AI.
 */
export interface ParsedCapture {
  title: string;
  content: string;
  tags: string[];
  mood: MoodLevel | null;
  entryType: EntryType;
}

const MOOD_WORDS: Record<string, MoodLevel> = {
  very_low: "very_low",
  terrible: "very_low",
  awful: "very_low",
  low: "low",
  bad: "low",
  sad: "low",
  neutral: "neutral",
  okay: "neutral",
  ok: "neutral",
  fine: "neutral",
  good: "good",
  happy: "good",
  great: "excellent",
  excellent: "excellent",
  amazing: "excellent",
};

export function parseCapture(input: string): ParsedCapture {
  const text = input.trim();

  const tags: string[] = [];
  for (const m of text.matchAll(/#([a-z0-9_-]+)/gi)) tags.push(m[1]!.toLowerCase());

  let mood: MoodLevel | null = null;
  const moodMatch = text.match(/\/mood\s+([a-z_]+)/i);
  if (moodMatch) mood = MOOD_WORDS[moodMatch[1]!.toLowerCase()] ?? null;

  // Strip directives from the visible content.
  const content = text
    .replace(/\/mood\s+[a-z_]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Title = first line / first sentence (up to ~80 chars).
  const firstLine = content.split(/[.\n]/)[0]?.trim() ?? "";
  const title = firstLine.length > 80 ? firstLine.slice(0, 77).trimEnd() + "…" : firstLine;

  const entryType: EntryType = tags.includes("gratitude")
    ? "gratitude"
    : tags.includes("idea")
      ? "idea"
      : "daily";

  return { title: title || "Untitled", content, tags, mood, entryType };
}
