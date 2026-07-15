import { makeBlock } from "./blockers";
import type { PlannerBlockType } from "./constants";
import type { PlannerBlock } from "./types";

/**
 * Manual block parser (Sprint 2.6). Deterministically turns a phrase like
 * "Team sync 2pm-3pm" into a planner block draft. No AI. Used for manual
 * meetings / breaks the user adds to the timeline.
 */
function parseTime(token: string, date: string): Date | null {
  const m = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hour = parseInt(m[1]!, 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && hour < 12) hour += 12;
  if (ap === "am" && hour === 12) hour = 0;
  if (hour > 23 || min > 59) return null;
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, min, 0, 0);
  return d;
}

function detectType(text: string): PlannerBlockType {
  const t = text.toLowerCase();
  if (/\b(lunch|break|rest|coffee)\b/.test(t)) return "break";
  if (/\b(meeting|sync|call|standup|1:1|interview|review)\b/.test(t)) return "meeting";
  return "meeting";
}

const RANGE_RE =
  /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
const DURATION_RE =
  /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b(?:\s*(?:for)?\s*(\d+(?:\.\d+)?)\s*(h|hr|hour|hours|m|min|mins|minutes))?/i;

/** Parse a manual block. Returns null when no time can be determined. */
export function parseBlock(text: string, date: string, now: Date): PlannerBlock | null {
  const type = detectType(text);
  let start: Date | null = null;
  let end: Date | null = null;
  let matched = "";

  const range = text.match(RANGE_RE);
  if (range) {
    start = parseTime(range[1]!, date);
    end = parseTime(range[2]!, date);
    matched = range[0];
  } else {
    const dur = text.match(DURATION_RE);
    if (dur && dur[2]) {
      start = parseTime(dur[1]!, date);
      const value = parseFloat(dur[2]);
      const unit = dur[3]!.toLowerCase();
      const minutes = unit.startsWith("h") ? Math.round(value * 60) : value;
      if (start) end = new Date(start.getTime() + minutes * 60_000);
      matched = dur[0];
    }
  }

  if (!start || !end || end.getTime() <= start.getTime()) return null;

  const title =
    text
      .replace(matched, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[\s,-]+$/g, "")
      .trim() || "Untitled block";

  return makeBlock(date, type, title, start, end, {
    generated: false,
    source: "manual",
    createdAt: now.toISOString(),
  });
}
