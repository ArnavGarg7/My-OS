import { DASHBOARD_WIDGETS, type DashboardWidget, type ReviewPeriod } from "./constants";
import { buildReviewSnapshot } from "./reviews";
import type { Collection, DashboardPreferences, IntelligenceInput, ReviewSnapshot } from "./types";

/**
 * Intelligence engine (Sprint 4.4). Constructors for the ONLY things this platform persists:
 * dashboard layout preferences, collections (reference groupings) and immutable review
 * snapshots. `newId` and `now` are injected so the core stays pure. No derived metric is
 * ever constructed here — those are all recomputed on read.
 */

export interface EngineDeps {
  newId: () => string;
  now: () => Date;
}

export class IntelligenceEngine {
  constructor(private readonly deps: EngineDeps) {}

  private iso(): string {
    return this.deps.now().toISOString();
  }

  /** Default layout: every widget, in declaration order, none hidden. */
  defaultPreferences(): DashboardPreferences {
    return {
      widgetOrder: [...DASHBOARD_WIDGETS],
      hiddenWidgets: [],
      updatedAt: this.iso(),
    };
  }

  /**
   * Reconcile a stored order against the current widget set: keep the user's order, append
   * any widgets added since, drop any that no longer exist. Keeps layout config valid across
   * releases without ever touching business data.
   */
  reconcilePreferences(stored: DashboardPreferences): DashboardPreferences {
    const valid = new Set<DashboardWidget>(DASHBOARD_WIDGETS);
    const kept = stored.widgetOrder.filter((w) => valid.has(w));
    const missing = DASHBOARD_WIDGETS.filter((w) => !kept.includes(w));
    return {
      widgetOrder: [...kept, ...missing],
      hiddenWidgets: stored.hiddenWidgets.filter((w) => valid.has(w)),
      updatedAt: this.iso(),
    };
  }

  makeCollection(input: {
    name: string;
    entityRefs?: { module: string; id: string }[];
  }): Collection {
    const iso = this.iso();
    return {
      id: this.deps.newId(),
      name: input.name.trim(),
      entityRefs: input.entityRefs ?? [],
      createdAt: iso,
      updatedAt: iso,
    };
  }

  /** Build an immutable review snapshot from the composed input. */
  makeReviewSnapshot(
    input: IntelligenceInput,
    period: ReviewPeriod,
    periodStart: string,
  ): ReviewSnapshot {
    return buildReviewSnapshot(input, period, periodStart, this.deps.now());
  }
}

export function createIntelligenceEngine(deps: EngineDeps): IntelligenceEngine {
  return new IntelligenceEngine(deps);
}
