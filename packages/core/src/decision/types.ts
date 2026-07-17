import type { DailyFocus, DailyMetrics, DailyState, TodaySnapshot, WorkingHours } from "../today";
import type { DecisionPriority, DecisionState, DecisionType } from "./constants";

/**
 * Decision engine types (Sprint 2.3). A Decision is an actionable, explainable,
 * trackable recommendation with a lifecycle. All values are deterministic.
 */
export interface Decision {
  /** Persistence id; "" for a not-yet-persisted decision. */
  id: string;
  /** The rule that produced it — the identity key within a day. */
  ruleId: string;
  type: DecisionType;
  title: string;
  reason: string;
  confidence: number; // 0–100
  priority: DecisionPriority;
  score: number; // 0–100
  state: DecisionState;
  inputsUsed: string[];
  expiresAt: string | null; // ISO
  deferredUntil: string | null; // ISO
  completedAt: string | null; // ISO
  createdAt: string; // ISO
  metadata: Record<string, unknown>;
}

/** Everything the engine needs to generate + score decisions. */
export interface DecisionContext {
  now: Date;
  timezone: string;
  state: DailyState | null;
  focus: DailyFocus | null;
  metrics: DailyMetrics | null;
  workingHours: WorkingHours;
  snapshot: TodaySnapshot;
  /** Count of unprocessed inbox items (Sprint 2.4) — feeds inbox-overflow. */
  inboxCount?: number;
  /** Project signals (Sprint 2.8) — derived, feed the project-attention rules. */
  project?: {
    /** Highest-priority active project's name, if any. */
    topProjectName?: string | null;
    /** Milestones due within the critical window across active projects. */
    criticalMilestones?: { projectName: string; title: string; dueInDays: number }[];
    /** How many projects are at risk / behind / blocked. */
    atRiskCount?: number;
  };
  /** Health signals (Sprint 2.9) — deterministic readiness/recovery inputs. */
  health?: {
    readiness?: number;
    lowSleep?: boolean;
    highReadiness?: boolean;
    recovery?: "recovered" | "recovering" | "fatigued" | "overtrained";
  };
  /** Finance signals (Sprint 2.11) — derived budget/payment/savings inputs. */
  finance?: {
    overBudgetCategories?: string[];
    largePaymentDueToday?: { name: string; amount: number } | null;
    savingsNearlyComplete?: { title: string; remaining: number } | null;
  };
  /** Goal signals (Sprint 2.12) — derived goal/habit/review inputs. */
  goal?: {
    behindGoals?: { title: string; progress: number }[];
    habitsAtRisk?: { title: string }[];
    quarterEnding?: boolean;
  };
  /** Analytics signals (Sprint 2.14) — derived trend/velocity/score inputs. */
  analytics?: {
    plannerAccuracyFalling?: boolean;
    goalVelocityDeclining?: boolean;
    productivityTrendFalling?: boolean;
    meetingHeavy?: boolean;
  };
  /** Tomorrow Studio signals (Sprint 3.1) — evening-planning inputs. */
  tomorrow?: {
    tooMuchUnfinished?: boolean;
    heavyMeetingDay?: boolean;
    lowReadiness?: boolean;
  };
  /** Focus Mode signals (Sprint 3.2) — deep-work execution inputs. */
  focusMode?: {
    active?: boolean;
    tooManyInterruptions?: boolean;
    longUnfinished?: boolean;
    plannerDrift?: boolean;
  };
  /** Notification signals (Sprint 3.3) — notification-hygiene inputs. */
  notifications?: {
    tooManyIgnored?: boolean;
    criticalOverdue?: boolean;
    repeatedSnoozes?: boolean;
  };
  /** Automation signals (Sprint 3.4) — automation-health inputs. */
  automation?: {
    failuresToday?: boolean;
    runawayRule?: boolean;
    pendingApprovals?: boolean;
  };
  /** Orchestration signals (Sprint 3.5) — system-health inputs. */
  orchestration?: {
    failuresToday?: boolean;
    recoveryRequired?: boolean;
    pipelinesPending?: boolean;
  };
  /** Knowledge signals (Sprint 4.1) — learning + memory inputs. */
  knowledge?: {
    flashcardsOverdue?: boolean;
    bookStalled?: boolean;
    courseDeadline?: boolean;
    researchInactive?: boolean;
    learningGoalFalling?: boolean;
  };
  /** Life signals (Sprint 4.2) — habits, routines, health + growth inputs. */
  life?: {
    habitStreakAtRisk?: boolean;
    routineSkipped?: boolean;
    lowRecovery?: boolean;
    doctorAppointment?: boolean;
    medicationDue?: boolean;
    trainingLoadHigh?: boolean;
    identityGoalStalled?: boolean;
  };
  /** Resource & Relationship platform signals (Sprint 4.3). Thresholds live in core/resource. */
  resources?: {
    insuranceExpiring?: boolean;
    documentExpiring?: boolean;
    maintenanceOverdue?: boolean;
    relationshipCold?: boolean;
    portfolioUnbalanced?: boolean;
    largeExpenseDue?: boolean;
    investmentReviewDue?: boolean;
  };
  /** Personal Intelligence dashboard signals (Sprint 4.4). Thresholds live in core/intelligence. */
  dashboard?: {
    multipleAreasDeclining?: boolean;
    overallHealthLow?: boolean;
    overallGrowthPositive?: boolean;
    reviewDue?: boolean;
    lifeBalanceLow?: boolean;
    attentionOverload?: boolean;
  };
}

/** A rule's built content before it becomes a full Decision. */
export interface BuiltDecision {
  title: string;
  reason: string;
  confidence: number;
  inputsUsed: string[];
  expiresInMinutes?: number | null;
}

export interface ScoreComponent {
  label: string;
  value: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreComponent[];
}

export interface DecisionExplanation {
  ruleId: string;
  rule: string;
  reason: string;
  confidence: number;
  inputs: string[];
  score: number;
  breakdown: ScoreComponent[];
}
