import { attentionItems, needsAttention } from "./attention";
import { decliningAreas, improvingAreas, lifeBalance } from "./life-areas";
import { reviewsDueCount } from "./reviews";
import type { IntelligenceInput, IntelligenceStatistics } from "./types";

/**
 * Intelligence statistics (Sprint 4.4). Counts over the composed views — how many areas are
 * moving which way, how much needs attention, how many reviews are due. Pure aggregation;
 * every underlying number was computed by an owning module.
 */

export function buildStatistics(
  input: IntelligenceInput,
  extras: { milestonesUpcoming: number; achievementsUnlocked: number },
): IntelligenceStatistics {
  const balance = lifeBalance(input);
  const attention = attentionItems(input);
  return {
    overall: balance.overall,
    areasImproving: improvingAreas(balance.areas).length,
    areasDeclining: decliningAreas(balance.areas).length,
    attentionItems: needsAttention(attention).length,
    milestonesUpcoming: extras.milestonesUpcoming,
    achievementsUnlocked: extras.achievementsUnlocked,
    reviewsDue: reviewsDueCount(input),
  };
}

export function emptyStatistics(): IntelligenceStatistics {
  return {
    overall: 0,
    areasImproving: 0,
    areasDeclining: 0,
    attentionItems: 0,
    milestonesUpcoming: 0,
    achievementsUnlocked: 0,
    reviewsDue: 0,
  };
}
