import type {
  AttentionLevel,
  DashboardWidget,
  LifeArea,
  MilestoneStatus,
  ReportFormat,
  ReviewPeriod,
  TrendDirection,
} from "./constants";

/**
 * Personal Intelligence types (Sprint 4.4). The `IntelligenceInput` below is the whole
 * design: every number the dashboard shows arrives ALREADY COMPUTED by the module that owns
 * it. The intelligence core groups, bands, sorts and explains — it never recomputes a score.
 * The server is what fills this struct from each engine's read model.
 */

/* ── The composed input (owned numbers only) ────────────────────────────── */

/** A raw 0–100 score the dashboard rolls into a life area, plus its prior value for trend. */
export interface AreaSignal {
  /** Current score, already computed by the owning module. */
  score: number;
  /** Same score one period ago, for trend/velocity. Null = no history yet. */
  previous: number | null;
}

/** Everything the intelligence engine composes, one field per owning module. */
export interface IntelligenceInput {
  /** Overall analytics score (0–100), from the Analytics ScoreBoard. */
  analytics: {
    productivity: number;
    focus: number;
    planner: number;
    health: number;
    goals: number;
    finance: number;
    journal: number;
    overall: number;
    /** The same board one period ago, for trends. Null on the first run. */
    previous: ScoreBoardLike | null;
  };
  /** Health readiness (0–100) + recovery, from the Health engine. */
  health: { readiness: number; recovery: number; previousReadiness: number | null };
  /** Knowledge/learning counts, from the Knowledge platform. */
  learning: {
    coursesActive: number;
    flashcardsDue: number;
    booksReading: number;
    learningScore: number;
    previousScore: number | null;
  };
  /** Resource portfolio signals, from the Resource platform. */
  resources: {
    netWorth: number;
    upcomingRenewals: number;
    documentsExpiring: number;
    relationshipsStrong: number;
    relationshipsDormant: number;
    followUpsDue: number;
  };
  /** Finance signals, from the Finance engine. */
  finance: { cashBalance: number; overBudget: boolean; savingsProgress: number };
  /** Goal signals, from the Goal engine. */
  goals: { onTrack: number; slipping: number; total: number; velocity: number };
  /** Habit signals, from the Life platform. */
  habits: { consistency: number; bestStreak: number; atRisk: number };
  /** Planner completion, from the Planner engine. */
  planner: { accuracy: number; completionRate: number };
  /** Journal/review activity, from the Journal engine. */
  journal: { entriesThisWeek: number; lastReviewDaysAgo: number | null; growthScore: number };
  /** How many days since each period-review was last completed. Null = never. */
  reviewsDue: Record<ReviewPeriod, number | null>;
}

/** A structural echo of the Analytics ScoreBoard — intelligence never imports analytics. */
export interface ScoreBoardLike {
  productivity: number;
  focus: number;
  planner: number;
  health: number;
  goals: number;
  finance: number;
  journal: number;
  overall: number;
}

/* ── Derived views (all recomputed, never stored) ───────────────────────── */

/** A structured (never prose) executive snapshot of the whole day. */
export interface ExecutiveSummary {
  overall: number;
  overallLevel: AttentionLevel;
  healthScore: number;
  focusLabel: "high" | "medium" | "low";
  plannerAccuracy: number;
  habitConsistency: number;
  learning: { coursesActive: number; flashcardsDue: number };
  resources: { upcomingRenewals: number };
  goals: { onTrack: number; slipping: number };
  /** The single most important thing to look at, or null when all is well. */
  topAttention: string | null;
}

/** One life area's derived rollup. Score and trend are computed from the owned signals. */
export interface LifeAreaView {
  area: LifeArea;
  label: string;
  score: number;
  trend: TrendDirection;
  /** Signed points moved since the previous period. */
  velocity: number;
  level: AttentionLevel;
}

/** The whole-life rollup across the eight areas. */
export interface LifeBalance {
  areas: LifeAreaView[];
  /** Weighted overall life score, 0–100. */
  overall: number;
  /** True when the spread between best and worst area exceeds the balance limit. */
  imbalanced: boolean;
  strongest: LifeArea;
  weakest: LifeArea;
}

/** Radar-chart values for the Wheel of Life. Pure re-projection of the life areas. */
export interface WheelSlice {
  area: LifeArea;
  label: string;
  value: number; // 0–100
}

/** A named scorecard grouping several owned metrics under a heading. */
export interface Scorecard {
  key: "productivity" | "health" | "learning" | "finance" | "relationships" | "growth";
  label: string;
  score: number;
  level: AttentionLevel;
  /** The contributing metrics, each already computed by its owner. */
  metrics: { label: string; value: string }[];
}

/** An item surfaced by the deterministic attention engine, worst first. */
export interface AttentionItem {
  id: string;
  level: AttentionLevel;
  area: LifeArea;
  title: string;
  /** Why it surfaced — a restatement of the deterministic rule, never a prediction. */
  reason: string;
}

/** A single point in a trend series. */
export interface TrendPoint {
  label: string;
  value: number;
}

/** A named metric's trajectory over the comparison window. */
export interface TrendView {
  key: string;
  label: string;
  current: number;
  previous: number | null;
  direction: TrendDirection;
  /** Signed change, current − previous. */
  delta: number;
}

/** A milestone rolled up from an owning module. Status is derived from its date vs now. */
export interface MilestoneView {
  id: string;
  title: string;
  source: string;
  status: MilestoneStatus;
  date: string; // ISO date
  daysUntil: number; // negative = overdue
}

/** An achievement unlocked by an explicit deterministic rule. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** When the threshold was crossed, or null for a standing achievement. */
  unlockedAt: string | null;
}

/** The immutable snapshot a period review captures. */
export interface ReviewSnapshot {
  period: ReviewPeriod;
  periodStart: string; // YYYY-MM-DD
  overall: number;
  areas: LifeAreaView[];
  attention: AttentionItem[];
  highlights: string[];
  createdAt: string; // ISO
}

/** A generated report in one of the supported textual formats. */
export interface GeneratedReport {
  format: ReportFormat;
  period: ReviewPeriod;
  title: string;
  content: string;
  generatedAt: string; // ISO
}

/* ── Persisted config (the only stored rows — never analytics) ──────────── */

/** User dashboard layout. Stores ordering + visibility only, never business data. */
export interface DashboardPreferences {
  widgetOrder: DashboardWidget[];
  hiddenWidgets: DashboardWidget[];
  updatedAt: string;
}

/** A user-defined collection that GROUPS existing entities by reference. */
export interface Collection {
  id: string;
  name: string;
  /** References into other modules — "entity ids", never copies of their data. */
  entityRefs: { module: string; id: string }[];
  createdAt: string;
  updatedAt: string;
}

/* ── Roll-ups ───────────────────────────────────────────────────────────── */

export interface IntelligenceStatistics {
  overall: number;
  areasImproving: number;
  areasDeclining: number;
  attentionItems: number;
  milestonesUpcoming: number;
  achievementsUnlocked: number;
  reviewsDue: number;
}

/** The compact read model Morning/Tomorrow/status bar consume. */
export interface IntelligenceSummary {
  overall: number;
  overallLevel: AttentionLevel;
  focusLabel: "high" | "medium" | "low";
  needsAttention: number;
  strongest: LifeArea;
  weakest: LifeArea;
  reviewsDue: number;
}

/** Boolean facts the Decision engine consumes. Thresholds live in constants, not the rules. */
export interface IntelligenceSignals {
  multipleAreasDeclining: boolean;
  overallHealthLow: boolean;
  overallGrowthPositive: boolean;
  reviewDue: boolean;
  lifeBalanceLow: boolean;
  attentionOverload: boolean;
}

/** A pearson correlation between two life-area score series. */
export interface AreaCorrelation {
  label: string;
  coefficient: number;
  samples: number;
}
