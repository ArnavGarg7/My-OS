/**
 * Drizzle schema — 05_Database_Design.md is the source of truth for shape.
 *
 * Domain schema files (one per domain: identity, tasks, planner, health,
 * finance, …) are re-exported here. Sprint 1.5 adds the identity domain
 * (auth_users + user_preferences); no productivity tables yet.
 */
export * from "./identity";
export * from "./platform";
