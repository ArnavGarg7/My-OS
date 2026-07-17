import { LIFE_AREA_LABELS, type ReportFormat, type ReviewPeriod } from "./constants";
import type { GeneratedReport, ReviewSnapshot } from "./types";

/**
 * Report generator (Sprint 4.4). Renders a review snapshot into Markdown or JSON. There is
 * no new data here — a report is a formatting of a snapshot the review engine already built
 * from read models. PDF is produced by the client from the Markdown; the deterministic core
 * only emits text so it stays pure and testable.
 */

const PERIOD_LABEL: Record<ReviewPeriod, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function toMarkdown(snapshot: ReviewSnapshot): string {
  const lines: string[] = [];
  lines.push(`# ${PERIOD_LABEL[snapshot.period]} Review — ${snapshot.periodStart}`);
  lines.push("");
  lines.push(`**Overall life score:** ${snapshot.overall}/100`);
  lines.push("");
  lines.push("## Life areas");
  for (const a of snapshot.areas) {
    const arrow = a.trend === "rising" ? "↑" : a.trend === "falling" ? "↓" : "→";
    lines.push(
      `- **${LIFE_AREA_LABELS[a.area]}**: ${a.score} ${arrow} (${a.velocity >= 0 ? "+" : ""}${a.velocity})`,
    );
  }
  if (snapshot.highlights.length > 0) {
    lines.push("");
    lines.push("## Highlights");
    for (const h of snapshot.highlights) lines.push(`- ${h}`);
  }
  if (snapshot.attention.length > 0) {
    lines.push("");
    lines.push("## Needs attention");
    for (const i of snapshot.attention.slice(0, 8)) lines.push(`- ${i.title} — ${i.reason}`);
  }
  return lines.join("\n");
}

export function generateReport(
  snapshot: ReviewSnapshot,
  format: ReportFormat,
  now: Date,
): GeneratedReport {
  const content = format === "json" ? JSON.stringify(snapshot, null, 2) : toMarkdown(snapshot);
  return {
    format,
    period: snapshot.period,
    title: `${PERIOD_LABEL[snapshot.period]} Review — ${snapshot.periodStart}`,
    content,
    generatedAt: now.toISOString(),
  };
}
