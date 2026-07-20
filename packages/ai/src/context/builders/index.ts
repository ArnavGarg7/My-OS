/**
 * Context builders (Sprint 5.1, 06_AI_Architecture §4). Each builder turns an already-fetched read
 * model into a bounded, deterministically-serialized snapshot with a token budget and priority.
 * Builders contain NO prompt logic and NO business logic — they only shape and bound data the
 * server fetched from the deterministic engines' public read models. The Budget Manager (not the
 * builder) owns truncation, so builders always report their true token estimate.
 *
 * 5.1 ships the builder REGISTRY + a generic runner. Feature sprints add richer per-builder shaping.
 */
import type { BuilderSpec, Snapshot } from "../snapshot";
import { serializeSnapshotData } from "../serializer";

/**
 * The builder catalogue with token budgets + priorities (06_AI_Architecture §4 table). Priority
 * orders truncation: `profile`/`season`/`today` survive longest. `season` is included in every
 * feature profile (PRD FR-SEASON-4).
 */
export const BUILDER_SPECS: Record<string, BuilderSpec> = {
  profile: { name: "profile", budget: 300, priority: 100 },
  season: { name: "season", budget: 150, priority: 95 },
  today: { name: "today", budget: 900, priority: 90 },
  tasks_relevant: { name: "tasks_relevant", budget: 1200, priority: 80 },
  calendar_window: { name: "calendar_window", budget: 600, priority: 75 },
  planner: { name: "planner", budget: 700, priority: 72 },
  projects_active: { name: "projects_active", budget: 500, priority: 65 },
  goals: { name: "goals", budget: 300, priority: 60 },
  health_week: { name: "health_week", budget: 400, priority: 55 },
  finance_month: { name: "finance_month", budget: 400, priority: 50 },
  knowledge: { name: "knowledge", budget: 400, priority: 45 },
  resources: { name: "resources", budget: 400, priority: 42 },
  timeline: { name: "timeline", budget: 400, priority: 40 },
  memories: { name: "memories", budget: 400, priority: 35 },
  retrieved: { name: "retrieved", budget: 800, priority: 30 },
};

/** Feature → ordered builder names (06_AI_Architecture §4 feature profiles). */
export const FEATURE_PROFILES: Record<string, string[]> = {
  assistant: ["profile", "season", "today", "memories"],
  planner: [
    "profile",
    "season",
    "today",
    "tasks_relevant",
    "calendar_window",
    "planner",
    "memories",
    "health_week",
  ],
  weekly_review: ["profile", "season", "goals", "health_week", "finance_month", "timeline"],
  daily_copilot: ["profile", "season", "today", "tasks_relevant", "calendar_window", "goals"],
};

/** Run a builder over its data → a snapshot. Generic + deterministic. Unknown builder → priority 0. */
export function runBuilder(name: string, data: unknown): Snapshot {
  const spec = BUILDER_SPECS[name] ?? { name, budget: 300, priority: 0 };
  const { tokenEstimate } = serializeSnapshotData(data);
  return { builder: name, data, tokenEstimate, priority: spec.priority };
}

/** Build every snapshot for a feature profile from a data map. Missing data → skipped. */
export function buildProfile(feature: string, dataByBuilder: Record<string, unknown>): Snapshot[] {
  const names = FEATURE_PROFILES[feature] ?? Object.keys(BUILDER_SPECS);
  return names.filter((n) => n in dataByBuilder).map((n) => runBuilder(n, dataByBuilder[n]));
}
