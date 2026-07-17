import { attentionByLevel, attentionItems } from "./attention";
import { executiveSummary } from "./executive-summary";
import { lifeBalance } from "./life-areas";
import { scorecards } from "./scorecards";
import { trends } from "./trends";
import { wheelOfLife } from "./wheel";
import type {
  AttentionItem,
  ExecutiveSummary,
  IntelligenceInput,
  LifeBalance,
  Scorecard,
  TrendView,
  WheelSlice,
} from "./types";
import type { AttentionLevel } from "./constants";

/**
 * Dashboard composition (Sprint 4.4). The single object the executive view reads. It is a
 * pure fan-out over the other intelligence modules — each of which is itself a fan-out over
 * owned read models — so the whole dashboard is one deterministic function of the composed
 * input. Nothing here is stored.
 */

export interface Dashboard {
  summary: ExecutiveSummary;
  balance: LifeBalance;
  wheel: WheelSlice[];
  scorecards: Scorecard[];
  attention: AttentionItem[];
  attentionByLevel: Record<AttentionLevel, AttentionItem[]>;
  trends: TrendView[];
}

export function buildDashboard(input: IntelligenceInput): Dashboard {
  const balance = lifeBalance(input);
  const attention = attentionItems(input);
  return {
    summary: executiveSummary(input),
    balance,
    wheel: wheelOfLife(balance.areas),
    scorecards: scorecards(input),
    attention,
    attentionByLevel: attentionByLevel(attention),
    trends: trends(input),
  };
}
