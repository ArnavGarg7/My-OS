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
