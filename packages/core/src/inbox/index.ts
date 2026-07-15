/**
 * Universal Inbox domain (Sprint 2.4) — pure, DB-agnostic capture engine. The
 * server (persistence + tRPC) and the UI both consume this; neither reimplements
 * capture, duplicate detection, search, or destination suggestions.
 */
export * from "./constants";
export * from "./types";
export * from "./capture";
export * from "./organizer";
export * from "./engine";
export * from "./selectors";
export * from "./schemas";
