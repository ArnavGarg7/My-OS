/**
 * Data classification registry (Phase 4.5, Security). Assigns every persisted domain a data
 * sensitivity class and states, explicitly, what may cross the boundary to an external AI model
 * in Phase 5. There is NO AI in the system today — this is the contract Phase 5 must honour.
 *
 * The registry is deliberately domain-grained (one entry per schema file) with table-level
 * overrides for the rows that hold free text or PII, so it stays complete and auditable as the
 * schema grows (scripts/security-audit.mjs asserts every table maps to a classified domain).
 *
 * Classification levels (least → most restricted):
 *   - public    Non-identifying, shareable as-is (enum labels, static option lists, counts).
 *   - internal  Operational metadata with no personal content (ids, timestamps, statuses).
 *   - sensitive Personal but not secret — reveals habits/health/finances if disclosed.
 *   - private   Secrets or free-text PII (auth tokens, email, journal/note bodies).
 *
 * AI-safe boundary: raw `sensitive`/`private` rows are NEVER sent to an external model. Only the
 * DERIVED read models (summaries, signals, scores) are AI-safe, because they are aggregated and
 * carry no free text or identifiers. `AI_SAFE_SURFACES` is that allowlist.
 */

export type DataClass = "public" | "internal" | "sensitive" | "private";

/** Ordering for comparisons ("is at least as restricted as"). */
export const DATA_CLASS_RANK: Record<DataClass, number> = {
  public: 0,
  internal: 1,
  sensitive: 2,
  private: 3,
};

export interface DomainClassification {
  /** The schema file (packages/db/src/schema/<file>) this entry classifies. */
  file: string;
  /** Default class applied to every table in the file unless overridden below. */
  level: DataClass;
  /** Whether RAW rows of this domain may be sent to an external AI model. Almost always false. */
  rawAiSafe: boolean;
  /** Why this level — the reviewer's note. */
  rationale: string;
  /** Tables in this file that are MORE restricted than the domain default (free text / PII). */
  overrides?: Record<string, DataClass>;
}

/**
 * The classification table. One row per schema file; `overrides` bumps individual tables that
 * hold free-text bodies or identifiers up to `private`. Raw rows are never AI-safe except where
 * a domain is purely non-identifying config/derived data (intelligence).
 */
export const DOMAIN_CLASSIFICATION: DomainClassification[] = [
  {
    file: "identity.ts",
    level: "private",
    rawAiSafe: false,
    rationale:
      "auth_users holds email + provider identifiers; user_preferences holds personal settings. PII — never leaves the system.",
  },
  {
    file: "today.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Daily state, focus and metrics describe personal routines; notes are free text.",
    overrides: { daily_notes: "private", decision_history: "sensitive" },
  },
  {
    file: "inbox.ts",
    level: "private",
    rawAiSafe: false,
    rationale: "Inbox items are raw free-text capture — treat as private until organised.",
  },
  {
    file: "task.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Task titles/notes are personal free text; labels/recurrence are internal.",
    overrides: { tasks: "private" },
  },
  {
    file: "planner.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Planner blocks reference personal tasks/meetings by title.",
  },
  {
    file: "calendar.ts",
    level: "private",
    rawAiSafe: false,
    rationale: "Calendar events carry titles, attendees and locations — private free text + PII.",
  },
  {
    file: "project.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Project/milestone names and history describe personal goals.",
  },
  {
    file: "health.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Sleep, recovery, hydration, nutrition, body measurements — health data. Never raw to AI.",
  },
  {
    file: "journal.ts",
    level: "private",
    rawAiSafe: false,
    rationale: "Journal entries and reflections are the most personal free text in the system.",
  },
  {
    file: "finance.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Accounts, transactions, budgets — financial data. Amounts never raw to AI.",
  },
  {
    file: "goal.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Goals, objectives, key results and reviews describe personal ambitions; reviews are free text.",
    overrides: { goal_reviews: "private" },
  },
  {
    file: "timeline.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Timeline aggregates references to every module's events — as sensitive as its sources.",
  },
  {
    file: "analytics.ts",
    level: "internal",
    rawAiSafe: false,
    rationale:
      "Snapshots of derived scores; non-identifying but reveal patterns — AI reads via read models only.",
  },
  {
    file: "tomorrow.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Tomorrow plans/priorities/reviews reference personal tasks and are partly free text.",
    overrides: { tomorrow_reviews: "private" },
  },
  {
    file: "focus.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Focus sessions describe work patterns and reference tasks.",
  },
  {
    file: "notification.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Notifications embed message text drawn from every module.",
  },
  {
    file: "automation.ts",
    level: "internal",
    rawAiSafe: false,
    rationale: "Rule definitions/conditions are configuration; payloads may embed personal text.",
  },
  {
    file: "orchestration.ts",
    level: "internal",
    rawAiSafe: false,
    rationale: "Pipeline runs and recovery records are operational metadata.",
  },
  {
    file: "knowledge.ts",
    level: "private",
    rawAiSafe: false,
    rationale: "Note bodies, flashcards, research are free-text second-brain content — private.",
  },
  {
    file: "life.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale: "Habits, routines, workouts, medications, injuries — health-adjacent personal data.",
    overrides: { medications: "private", injury_log: "private", medication_logs: "private" },
  },
  {
    file: "resource.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Investments, assets, vehicles, insurance, documents; relationships hold contact PII.",
    overrides: {
      relationships: "private",
      documents: "private",
      relationship_interactions: "private",
    },
  },
  {
    file: "intelligence.ts",
    level: "internal",
    rawAiSafe: true,
    rationale:
      "Config + immutable snapshots of already-derived, non-identifying scores. Safe to compose for AI context.",
  },
  {
    file: "platform.ts",
    level: "private",
    rawAiSafe: false,
    rationale: "Push subscriptions hold device endpoints + keys — secrets.",
  },
  {
    file: "ai.ts",
    level: "internal",
    rawAiSafe: true,
    rationale:
      "AI Core Platform + production-readiness infrastructure only — prompt registry/versions, provider health, eval runs, deterministic cache, stream sessions, plus Sprint 5.4 observability (execution traces), benchmarks, performance/cost metrics, security + reliability events. No business entities and no secret values (credentials live in provider_credentials/assistant.ts); operational metadata safe to compose for AI context.",
  },
  {
    file: "chief.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Chief of Staff interaction state — session/recommendation snapshots reference personal tasks and reasoning, feedback + the Personal AI Profile hold preference data. Config (provider policies) is internal, but recommendation/explanation snapshots can echo personal free text, so treat raw rows as sensitive.",
    overrides: { chief_recommendations: "private", chief_feedback: "private" },
  },
  {
    file: "assistant.ts",
    level: "private",
    rawAiSafe: false,
    rationale:
      "Conversational Chief state — assistant messages hold free-text conversation content, and provider_credentials stores ENCRYPTED API keys (server-side only, never returned or logged). The most sensitive AI data in the system; never crosses the AI boundary raw. assistant_modes config is internal.",
    overrides: { assistant_modes: "internal" },
  },
  {
    file: "signals.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Event Intelligence Engine state (Sprint 6.1) — immutable signals, their events/rankings/timeline/notifications and context-window membership. Explanations + related-object labels reference personal tasks/deadlines/health, so raw rows are sensitive; the DERIVED signal read models (current/risks/opportunities, already banded/scored) are what the Chief consumes. No user business data is owned here and no signal mutates it. Watcher/subscription config is internal.",
    overrides: { signal_watchers: "internal", signal_subscriptions: "internal" },
  },
  {
    file: "prediction.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Predictive Intelligence Engine state (Sprint 6.2) — immutable predictions + their models/history/confidence/scenarios/timelines/metrics/features. Forecast explanations and related-object labels reference personal goals/deadlines/health/study, so raw rows are sensitive; the DERIVED forecast read models (banded confidence + calculations) are what the Chief consumes. Deterministic — NO AI predicts, and no prediction mutates user data or triggers automations. Model/metrics config is internal.",
    overrides: { prediction_models: "internal", prediction_metrics: "internal" },
  },
  {
    file: "autopilot.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Proposal-First Automation Engine state (Sprint 6.3) — registered automations, proposals + immutable execution/verification/rollback records, per-automation policies/permissions, audit trail + metrics. Proposal reasons + execution plans reference personal signals/predictions and the actions taken on them, so raw rows are sensitive. Deterministic — NO AI executes; every mutation is proposal-gated, reversible, verified and audited. Registry/policy/permission/metrics config is internal.",
    overrides: {
      autopilot_automations: "internal",
      autopilot_triggers: "internal",
      autopilot_conditions: "internal",
      autopilot_policies: "internal",
      autopilot_permissions: "internal",
      autopilot_metrics: "internal",
    },
  },
  {
    file: "connectors.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      'Connector Platform state (Sprint 6.4) — external-service accounts, sync jobs/history/checkpoints, immutable normalized events, health/rate-limits/webhooks/permissions/metrics. Normalized events + their payloads reference personal calendar/email/code/chat activity, so raw rows are sensitive. Connectors own NO business logic and NO AI — they only answer "what changed?"; the Event Engine decides why it matters. connector_credentials is PRIVATE: AES-256-GCM ciphertext (secret/refresh tokens), server-only, never returned through the API and never reachable by the AI. Provider registry + rate-limit/webhook/permission/metrics config is internal.',
    overrides: {
      connector_credentials: "private",
      connector_providers: "internal",
      connector_rate_limits: "internal",
      connector_webhooks: "internal",
      connector_permissions: "internal",
      connector_metrics: "internal",
    },
  },
  {
    file: "adaptation.ts",
    level: "sensitive",
    rawAiSafe: false,
    rationale:
      "Adaptive Personal Intelligence state (Sprint 6.5, Phase 6 finale) — the deterministic Personal Profile: versioned profile fields, learned preferences (user-editable/disableable), habit + routine models, behavioral metrics, recommendation feedback, weekly/monthly reviews and personal insights. This IS a model of the user built from long-term behavior, so raw rows are sensitive. **NO AI writes here** — the OS learns deterministically from observed behaviour + explicit feedback; AI only reads/explains, and every learned value carries confidence + evidence + version. Nothing here mutates other modules' data or bypasses approval; personalization shapes presentation, not business logic. Learning-policy + confidence + immutable event-log config is internal.",
    overrides: {
      adaptation_policies: "internal",
      adaptation_confidence: "internal",
      adaptation_events: "internal",
    },
  },
];

/**
 * AI-safe surfaces (Phase 5 allowlist). These are the DERIVED server read models the AI Platform
 * may read. They are aggregated/scored/banded outputs — no free text, no identifiers — so passing
 * them to an external model does not disclose `private`/`sensitive` raw data. Anything NOT on this
 * list must not cross the AI boundary.
 */
export const AI_SAFE_SURFACES = [
  "summary",
  "signals",
  "statusSignal",
  "dashboard",
  "portfolio",
  "statistics",
] as const;

export type AiSafeSurface = (typeof AI_SAFE_SURFACES)[number];

/** Is a server read-model function name safe to pass to an external AI model? */
export function isAiSafeSurface(name: string): name is AiSafeSurface {
  return (AI_SAFE_SURFACES as readonly string[]).includes(name);
}

/** Resolve the classification of a specific table (applies domain default + overrides). */
export function classifyTable(file: string, table: string): DataClass | null {
  const entry = DOMAIN_CLASSIFICATION.find((d) => d.file === file);
  if (!entry) return null;
  return entry.overrides?.[table] ?? entry.level;
}

/** True if class `a` is at least as restricted as class `b`. */
export function isAtLeast(a: DataClass, b: DataClass): boolean {
  return DATA_CLASS_RANK[a] >= DATA_CLASS_RANK[b];
}
