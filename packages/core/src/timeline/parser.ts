/**
 * Timeline date parser (Sprint 2.13). Deterministic natural-date parsing for the
 * "Jump to Date" command — no NLP model. Understands ISO dates, "today",
 * "yesterday", "last week/month/year" and returns an inclusive day range.
 */

const DAY_MS = 86_400_000;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface ParsedDateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
  label: string;
}

/** Parse a date query relative to `now` (defaults to the current date). */
export function parseDateQuery(query: string, now: Date = new Date()): ParsedDateRange | null {
  const q = query.trim().toLowerCase();
  const todayStr = ymd(now);

  const isoMatch = q.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const day = isoMatch[0];
    return { from: day, to: day, label: day };
  }

  if (q === "today") return { from: todayStr, to: todayStr, label: "Today" };
  if (q === "yesterday") {
    const y = ymd(new Date(now.getTime() - DAY_MS));
    return { from: y, to: y, label: "Yesterday" };
  }

  if (q.includes("last week") || q === "week") {
    const start = ymd(new Date(now.getTime() - 7 * DAY_MS));
    return { from: start, to: todayStr, label: "Last 7 days" };
  }
  if (q.includes("last month") || q === "month") {
    const start = ymd(new Date(now.getTime() - 30 * DAY_MS));
    return { from: start, to: todayStr, label: "Last 30 days" };
  }
  if (q.includes("last year") || q === "year") {
    const start = ymd(new Date(now.getTime() - 365 * DAY_MS));
    return { from: start, to: todayStr, label: "Last 365 days" };
  }

  return null;
}
