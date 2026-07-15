import type { EventDraft } from "./types";

/**
 * Event parser (Sprint 2.7). Deterministically turns "Lunch with Sam 12-1pm
 * tomorrow" into an event draft. No AI. The user confirms before it is saved.
 */
function atHour(base: Date, addDays: number, hour: number, min = 0): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, min, 0, 0);
  return d;
}

function baseDay(text: string): number {
  const t = text.toLowerCase();
  if (/\btomorrow\b/.test(t)) return 1;
  if (/\bnext week\b/.test(t)) return 7;
  const inDays = t.match(/\bin (\d+) days?\b/);
  if (inDays) return parseInt(inDays[1]!, 10);
  return 0;
}

function parseClock(token: string): { hour: number; min: number } | null {
  const m = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hour = parseInt(m[1]!, 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && hour < 12) hour += 12;
  if (ap === "am" && hour === 12) hour = 0;
  if (hour > 23 || min > 59) return null;
  return { hour, min };
}

const RANGE = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
const AT = /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
const DATE_WORDS = /\b(today|tomorrow|next week|in \d+ days?)\b/gi;
const AMPM_INHERIT = /(am|pm)/i;

export function parseEvent(text: string, now: Date): EventDraft {
  const days = baseDay(text);
  const allDay = /\ball[- ]day\b/i.test(text);
  let startAt: string | null = null;
  let endAt: string | null = null;
  let matched = "";

  const range = text.match(RANGE);
  if (range && !allDay) {
    let s = parseClock(range[1]!);
    const e = parseClock(range[2]!);
    // Inherit am/pm from the end token when the start omits it ("12-1pm").
    if (s && !AMPM_INHERIT.test(range[1]!) && e && AMPM_INHERIT.test(range[2]!)) {
      if (e.hour >= 12 && s.hour < 12) s = { ...s, hour: s.hour + 12 };
    }
    if (s && e) {
      startAt = atHour(now, days, s.hour, s.min).toISOString();
      endAt = atHour(now, days, e.hour, e.min).toISOString();
      matched = range[0];
    }
  } else if (!allDay) {
    const at = text.match(AT);
    if (at) {
      const s = parseClock(at[1]!);
      if (s) {
        const start = atHour(now, days, s.hour, s.min);
        startAt = start.toISOString();
        endAt = new Date(start.getTime() + 60 * 60_000).toISOString();
        matched = at[0];
      }
    }
  }

  if (allDay) {
    const d = atHour(now, days, 0, 0);
    startAt = d.toISOString();
    endAt = new Date(d.getTime() + 24 * 60 * 60_000).toISOString();
  }

  const title =
    text
      .replace(matched, "")
      .replace(DATE_WORDS, "")
      .replace(/\ball[- ]day\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[\s,-]+$/g, "")
      .trim() || "Untitled event";

  return { title, startAt, endAt, allDay, location: "" };
}
