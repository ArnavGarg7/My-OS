import {
  COMPARISON_PERIODS,
  REPORT_TYPES,
  type ComparisonPeriod,
  type ReportType,
} from "./constants";

/**
 * Analytics query parser (Sprint 2.14). Deterministic mapping of free-text into
 * a report type or comparison period for the Command Center — no NLP.
 */
export function parseReportType(query: string): ReportType | null {
  const q = query.trim().toLowerCase();
  for (const t of REPORT_TYPES) if (q.includes(t)) return t;
  if (q.includes("week")) return "weekly";
  if (q.includes("month")) return "monthly";
  if (q.includes("quarter")) return "quarterly";
  if (q.includes("year")) return "yearly";
  if (q.includes("day") || q.includes("today")) return "daily";
  return null;
}

export function parseComparisonPeriod(query: string): ComparisonPeriod | null {
  const q = query.trim().toLowerCase();
  for (const p of COMPARISON_PERIODS) if (q.includes(p.replace("previous_", ""))) return p;
  if (q.includes("yesterday")) return "previous_day";
  return null;
}
