import { clampScore, levelForScore } from "./bands";
import type { IntelligenceInput, Scorecard } from "./types";

/**
 * Scorecards (Sprint 4.4). Six named groupings of owned metrics. The headline score of each
 * card is an average of scores its owners already computed; the metric rows below it restate
 * those owned numbers verbatim. Nothing here is a new calculation — it is presentation.
 */

function card(
  key: Scorecard["key"],
  label: string,
  score: number,
  metrics: Scorecard["metrics"],
): Scorecard {
  const s = clampScore(score);
  return { key, label, score: s, level: levelForScore(s), metrics };
}

export function productivityScorecard(input: IntelligenceInput): Scorecard {
  const a = input.analytics;
  const score = (a.productivity + a.focus + a.planner + input.planner.completionRate) / 4;
  return card("productivity", "Productivity", score, [
    { label: "Productivity", value: String(a.productivity) },
    { label: "Focus", value: String(a.focus) },
    { label: "Planner accuracy", value: `${input.planner.accuracy}%` },
    { label: "Completion", value: `${input.planner.completionRate}%` },
  ]);
}

export function healthScorecard(input: IntelligenceInput): Scorecard {
  const score = (input.health.readiness + input.health.recovery + input.habits.consistency) / 3;
  return card("health", "Health", score, [
    { label: "Readiness", value: String(input.health.readiness) },
    { label: "Recovery", value: String(input.health.recovery) },
    { label: "Habit consistency", value: `${input.habits.consistency}%` },
    { label: "Best streak", value: `${input.habits.bestStreak}d` },
  ]);
}

export function learningScorecard(input: IntelligenceInput): Scorecard {
  return card("learning", "Learning", input.learning.learningScore, [
    { label: "Active courses", value: String(input.learning.coursesActive) },
    { label: "Flashcards due", value: String(input.learning.flashcardsDue) },
    { label: "Books reading", value: String(input.learning.booksReading) },
  ]);
}

export function financeScorecard(input: IntelligenceInput): Scorecard {
  // The finance analytics score is the headline; resource + budget signals annotate it.
  return card("finance", "Finance", input.analytics.finance, [
    { label: "Savings progress", value: `${input.finance.savingsProgress}%` },
    { label: "Over budget", value: input.finance.overBudget ? "Yes" : "No" },
    {
      label: "Net worth",
      value: `₹${Math.round(input.resources.netWorth).toLocaleString("en-IN")}`,
    },
    { label: "Renewals due", value: String(input.resources.upcomingRenewals) },
  ]);
}

export function relationshipsScorecard(input: IntelligenceInput): Scorecard {
  const r = input.resources;
  const known = r.relationshipsStrong + r.relationshipsDormant;
  const score = known === 0 ? 50 : (r.relationshipsStrong / known) * 100;
  return card("relationships", "Relationships", score, [
    { label: "Strong ties", value: String(r.relationshipsStrong) },
    { label: "Dormant ties", value: String(r.relationshipsDormant) },
    { label: "Follow-ups due", value: String(r.followUpsDue) },
  ]);
}

export function growthScorecard(input: IntelligenceInput): Scorecard {
  const score = (input.journal.growthScore + input.analytics.goals) / 2;
  return card("growth", "Personal Growth", score, [
    { label: "Goals on track", value: String(input.goals.onTrack) },
    { label: "Goals slipping", value: String(input.goals.slipping) },
    { label: "Journal entries", value: String(input.journal.entriesThisWeek) },
    {
      label: "Last review",
      value:
        input.journal.lastReviewDaysAgo === null
          ? "never"
          : `${input.journal.lastReviewDaysAgo}d ago`,
    },
  ]);
}

export function scorecards(input: IntelligenceInput): Scorecard[] {
  return [
    productivityScorecard(input),
    healthScorecard(input),
    learningScorecard(input),
    financeScorecard(input),
    relationshipsScorecard(input),
    growthScorecard(input),
  ];
}
