import { parsePriority } from "./priority";
import { parseRecurrence } from "./recurrence";
import type { TaskDraft } from "./types";

/**
 * Task parser (Sprint 2.5). Turns a free-text capture into a structured task
 * draft — deterministically, no AI. Extracts title, description, urls, estimate,
 * due hint, priority hint and recurrence hint. The user always confirms the
 * draft before it becomes a real task.
 */

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_ABBR: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const URL_RE = /https?:\/\/[^\s]+/gi;
const DURATION_RE = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b|(\d+)\s*(minutes?|mins?|m)\b/gi;

/** Phrases stripped from the title once their meaning is captured. */
const STRIP_RES: RegExp[] = [
  URL_RE,
  /\b(every\s+\d+\s+(?:day|week|month|year)s?)\b/gi,
  /\b(daily|weekly|monthly|yearly|annually)\b/gi,
  /\bevery\s+(?:day|week|month|year|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/gi,
  /\b(urgent|asap|important|high priority|low priority|high-priority|low-priority)\b/gi,
  /!{2,}/g,
  /\b(today|tonight|tomorrow|this\s+(?:morning|afternoon|evening)|next\s+week|next\s+month)\b/gi,
  /\b(this|next)\s+(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/gi,
  /\bon\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  /\bin\s+\d+\s+days?\b/gi,
  /\b(tomorrow|this|next)?\s*(morning|afternoon|evening)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/gi,
];

function extractUrls(text: string): string[] {
  return text.match(URL_RE) ?? [];
}

/** Total estimated minutes from any duration mentions, or null. */
export function parseDuration(text: string): number | null {
  let total = 0;
  let found = false;
  for (const m of text.matchAll(DURATION_RE)) {
    found = true;
    if (m[1]) total += Math.round(parseFloat(m[1]) * 60);
    else if (m[3]) total += parseInt(m[3], 10);
  }
  return found ? total : null;
}

function partOfDayHour(text: string): number {
  const t = text.toLowerCase();
  if (/morning/.test(t)) return 9;
  if (/afternoon/.test(t)) return 14;
  if (/evening|tonight/.test(t)) return 19;
  return 9;
}

function atHour(base: Date, addDays: number, hour: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Deterministic relative-date resolution. Returns an ISO string or null. */
export function parseDue(text: string, now: Date): string | null {
  const t = text.toLowerCase();
  const hour = partOfDayHour(t);

  if (/\btomorrow\b/.test(t)) return atHour(now, 1, hour).toISOString();
  if (/\btonight\b/.test(t)) return atHour(now, 0, 19).toISOString();
  if (/\btoday\b|this\s+(morning|afternoon|evening)/.test(t))
    return atHour(now, 0, hour).toISOString();
  if (/\bnext\s+week\b/.test(t)) return atHour(now, 7, hour).toISOString();
  if (/\bnext\s+month\b/.test(t)) {
    const d = atHour(now, 0, hour);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  const inDays = t.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) return atHour(now, parseInt(inDays[1]!, 10), hour).toISOString();

  // weekday name → next occurrence (strictly future; same weekday → +7)
  for (const [abbr, target] of Object.entries(WEEKDAY_ABBR)) {
    const re = new RegExp(`\\b(?:next\\s+|on\\s+)?${abbr}[a-z]*\\b`);
    if (re.test(t) && WEEKDAYS.some((w) => t.includes(w.slice(0, 3)))) {
      const cur = now.getDay();
      let delta = (target - cur + 7) % 7;
      if (delta === 0) delta = 7;
      return atHour(now, delta, hour).toISOString();
    }
  }
  return null;
}

function cleanTitle(title: string): string {
  let out = title;
  for (const re of STRIP_RES) out = out.replace(re, " ");
  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[\s,;:-]+$/g, "")
    .trim();
}

export function parseTask(raw: string, now: Date): TaskDraft {
  const lines = raw.trim().split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  const description = lines.slice(1).join("\n").trim();

  const urls = extractUrls(raw);
  const recurrence = parseRecurrence(raw);
  const priority = parsePriority(raw) ?? "medium";
  const estimatedMinutes = parseDuration(raw);
  const dueAt = parseDue(raw, now);

  const title = cleanTitle(firstLine) || "Untitled task";

  return { title, description, priority, estimatedMinutes, dueAt, recurrence, urls };
}
