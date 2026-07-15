import type { CaptureType, Destination } from "./constants";
import type { DestinationSuggestion, InboxItem } from "./types";

/**
 * Organizer (Sprint 2.4). Produces deterministic destination *suggestions* only.
 * Nothing ever moves automatically — the user decides. Suggestions come from two
 * signals: the capture type (a strong hint) and keyword matches in the text.
 */

/** Keyword sets per destination. Matched case-insensitively as whole-ish words. */
const KEYWORDS: Record<Exclude<Destination, "General Notes">, string[]> = {
  Projects: [
    "project",
    "milestone",
    "ship",
    "feature",
    "build",
    "launch",
    "repo",
    "deploy",
    "sprint",
    "release",
  ],
  Journal: ["journal", "reflect", "grateful", "gratitude", "mood", "feeling", "diary", "today i"],
  Health: [
    "workout",
    "gym",
    "run",
    "sleep",
    "water",
    "weight",
    "health",
    "exercise",
    "meal",
    "diet",
    "calories",
    "steps",
  ],
  Planner: [
    "plan",
    "schedule",
    "tomorrow",
    "calendar",
    "appointment",
    "deadline",
    "todo",
    "agenda",
  ],
  College: [
    "class",
    "course",
    "assignment",
    "exam",
    "lecture",
    "professor",
    "semester",
    "homework",
    "study",
    "quiz",
  ],
  Internship: [
    "internship",
    "standup",
    "manager",
    "ticket",
    "jira",
    "pull request",
    "office",
    "colleague",
    "onboarding",
  ],
  Finance: [
    "budget",
    "expense",
    "spend",
    "money",
    "invoice",
    "salary",
    "tax",
    "invest",
    "savings",
    "payment",
    "rent",
    "bill",
  ],
  Goals: ["goal", "objective", "target", "resolution", "aspire", "long-term", "vision", "habit"],
  Decision: [
    "decide",
    "decision",
    "choose",
    "option",
    "should i",
    "versus",
    " vs ",
    "tradeoff",
    "trade-off",
  ],
};

/** A capture type maps directly to a primary destination hint. */
const TYPE_HINT: Partial<Record<CaptureType, Destination>> = {
  task: "Planner",
  journal: "Journal",
  decision_note: "Decision",
  meeting: "Planner",
  idea: "Projects",
};

const TYPE_BONUS = 40;
const KEYWORD_HIT = 18;

function countHits(haystack: string, needles: string[]): string[] {
  const matched: string[] = [];
  for (const needle of needles) {
    if (haystack.includes(needle)) matched.push(needle.trim());
  }
  return matched;
}

/**
 * Rank destinations for an item. Always returns at least "General Notes" as a
 * low-confidence fallback. Confidence is a clamped 0–100 built from the type
 * hint plus keyword hits — fully deterministic.
 */
export function suggestDestination(item: InboxItem): DestinationSuggestion[] {
  const haystack = `${item.title}\n${item.content}`.toLowerCase();
  const scores = new Map<Destination, { score: number; matched: string[] }>();

  const add = (destination: Destination, score: number, matched: string[]) => {
    const existing = scores.get(destination);
    if (existing) {
      existing.score += score;
      existing.matched.push(...matched);
    } else {
      scores.set(destination, { score, matched: [...matched] });
    }
  };

  const hint = TYPE_HINT[item.type];
  if (hint) add(hint, TYPE_BONUS, [`type:${item.type}`]);

  for (const [destination, needles] of Object.entries(KEYWORDS) as [
    Exclude<Destination, "General Notes">,
    string[],
  ][]) {
    const matched = countHits(haystack, needles);
    if (matched.length > 0) add(destination, matched.length * KEYWORD_HIT, matched);
  }

  const suggestions: DestinationSuggestion[] = [...scores.entries()]
    .map(([destination, { score, matched }]) => ({
      destination,
      confidence: Math.max(0, Math.min(100, score)),
      reason: buildReason(destination, matched, item.type),
      matched,
    }))
    .sort((a, b) => b.confidence - a.confidence || a.destination.localeCompare(b.destination));

  // Always offer General Notes as a catch-all (lowest priority).
  suggestions.push({
    destination: "General Notes",
    confidence: suggestions.length === 0 ? 40 : 10,
    reason: "Anything can live here until you decide.",
    matched: [],
  });

  return suggestions;
}

function buildReason(destination: Destination, matched: string[], type: CaptureType): string {
  const typeMatch = matched.find((m) => m.startsWith("type:"));
  const words = matched.filter((m) => !m.startsWith("type:"));
  if (typeMatch && words.length === 0) return `This looks like a ${type.replace("_", " ")}.`;
  if (words.length > 0) return `Mentions ${words.slice(0, 3).join(", ")}.`;
  return `Related to ${destination}.`;
}
