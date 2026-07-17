/**
 * Drizzle schema — 05_Database_Design.md is the source of truth for shape.
 *
 * Domain schema files (one per domain: identity, tasks, planner, health,
 * finance, …) are re-exported here. Sprint 1.5 adds the identity domain
 * (auth_users + user_preferences); no productivity tables yet.
 */
export * from "./identity";
export * from "./platform";
export * from "./today";
export * from "./inbox";
export * from "./task";
export * from "./planner";
export * from "./calendar";
export * from "./project";
export * from "./health";
export * from "./journal";
export * from "./finance";
export * from "./goal";
export * from "./timeline";
export * from "./analytics";
export * from "./tomorrow";
export * from "./focus";
export * from "./notification";
export * from "./automation";
export * from "./orchestration";
export * from "./knowledge";
export * from "./life";
export * from "./resource";
export * from "./intelligence";
