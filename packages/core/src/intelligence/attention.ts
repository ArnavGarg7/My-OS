import { levelRank } from "./bands";
import { lifeAreas } from "./life-areas";
import type { AttentionItem, IntelligenceInput, LifeAreaView } from "./types";
import type { AttentionLevel, LifeArea } from "./constants";

/**
 * Attention engine (Sprint 4.4). The deterministic "what deserves my attention right now"
 * layer. Every item below is produced by an explicit rule over signals another module
 * already computed — a slipping goal, a breaking streak, an overdue review. There is no
 * scoring model and no prediction: each item restates the rule that surfaced it, so the
 * panel is fully explainable.
 */

function item(
  id: string,
  level: AttentionLevel,
  area: LifeArea,
  title: string,
  reason: string,
): AttentionItem {
  return { id, level, area, title, reason };
}

/**
 * Rules over the owned signals. Ordered by area; the caller sorts worst-first. Each rule is
 * a plain boolean over a number the dashboard did not compute.
 */
export function attentionItems(input: IntelligenceInput): AttentionItem[] {
  const out: AttentionItem[] = [];

  // Goals.
  if (input.goals.slipping > 0) {
    out.push(
      item(
        "goal-slipping",
        "needs_attention",
        "career",
        `${input.goals.slipping} goal${input.goals.slipping === 1 ? "" : "s"} slipping`,
        "A goal is behind its expected pace — the Goal engine flagged it as off-track.",
      ),
    );
  }

  // Habits.
  if (input.habits.atRisk > 0) {
    out.push(
      item(
        "habit-streak",
        "at_risk",
        "health",
        `${input.habits.atRisk} habit streak${input.habits.atRisk === 1 ? "" : "s"} at risk`,
        "A habit due today is still undone and the day is running out.",
      ),
    );
  }

  // Health.
  if (input.health.readiness < 40) {
    out.push(
      item(
        "low-readiness",
        "needs_attention",
        "health",
        "Readiness is low",
        "Health readiness dropped below the ease-off threshold — favour rest today.",
      ),
    );
  } else if (
    input.health.previousReadiness !== null &&
    input.health.readiness - input.health.previousReadiness >= 5
  ) {
    out.push(
      item(
        "readiness-rising",
        "improving",
        "health",
        "Readiness is rising",
        "Readiness improved over the last period — recovery is trending the right way.",
      ),
    );
  }

  // Resources.
  if (input.resources.upcomingRenewals > 0) {
    out.push(
      item(
        "renewals-due",
        "needs_attention",
        "finance",
        `${input.resources.upcomingRenewals} renewal${input.resources.upcomingRenewals === 1 ? "" : "s"} due`,
        "An insurance policy, document or vehicle renewal falls inside its window.",
      ),
    );
  }
  if (input.resources.documentsExpiring > 0) {
    out.push(
      item(
        "documents-expiring",
        "at_risk",
        "finance",
        `${input.resources.documentsExpiring} document${input.resources.documentsExpiring === 1 ? "" : "s"} expiring`,
        "An identity document is inside its expiry window — these take weeks to renew.",
      ),
    );
  }

  // Finance.
  if (input.finance.overBudget) {
    out.push(
      item(
        "over-budget",
        "at_risk",
        "finance",
        "A budget category is over",
        "The Finance engine reports spending above a category's monthly limit.",
      ),
    );
  }

  // Learning.
  if (input.learning.flashcardsDue > 0) {
    out.push(
      item(
        "flashcards-due",
        "stable",
        "learning",
        `${input.learning.flashcardsDue} flashcard${input.learning.flashcardsDue === 1 ? "" : "s"} due`,
        "Spaced-repetition reviews are due — the ladder resets if they slip.",
      ),
    );
  }

  // Relationships.
  if (input.resources.followUpsDue > 0) {
    out.push(
      item(
        "follow-ups",
        "at_risk",
        "relationships",
        `${input.resources.followUpsDue} follow-up${input.resources.followUpsDue === 1 ? "" : "s"} due`,
        "A relationship has a scheduled follow-up whose date has arrived.",
      ),
    );
  }

  // Whole-life areas: a falling excellent/improving area earns an attention line.
  for (const area of lifeAreas(input)) {
    if (area.trend === "falling" && area.velocity <= -5) {
      out.push(
        item(
          `area-falling-${area.area}`,
          "at_risk",
          area.area,
          `${area.label} is declining`,
          `${area.label} fell ${Math.abs(area.velocity)} points versus the previous period.`,
        ),
      );
    }
  }

  return out.sort((a, b) => levelRank(a.level) - levelRank(b.level));
}

export function needsAttention(items: AttentionItem[]): AttentionItem[] {
  return items.filter((i) => i.level === "needs_attention");
}

export function atRisk(items: AttentionItem[]): AttentionItem[] {
  return items.filter((i) => i.level === "at_risk");
}

export function improving(items: AttentionItem[]): AttentionItem[] {
  return items.filter((i) => i.level === "improving");
}

/** Group attention items by their band, for the five-column panel. */
export function attentionByLevel(items: AttentionItem[]): Record<AttentionLevel, AttentionItem[]> {
  const out: Record<AttentionLevel, AttentionItem[]> = {
    needs_attention: [],
    at_risk: [],
    stable: [],
    improving: [],
    excellent: [],
  };
  for (const i of items) out[i.level].push(i);
  return out;
}

/** The single most important item, or null when nothing needs attention. */
export function topAttention(items: AttentionItem[]): AttentionItem | null {
  return items[0] ?? null;
}

/** Areas that are the weakest AND falling — used by the "stable/excellent" summary bands. */
export function areaLevels(areas: LifeAreaView[]): Record<AttentionLevel, LifeAreaView[]> {
  const out: Record<AttentionLevel, LifeAreaView[]> = {
    needs_attention: [],
    at_risk: [],
    stable: [],
    improving: [],
    excellent: [],
  };
  for (const a of areas) out[a.level].push(a);
  return out;
}
