/**
 * @myos/core/knowledge (Sprint 4.1) — the Knowledge & Memory Platform.
 *
 * A deterministic second brain: permanent markdown notes, an Obsidian-style wiki with
 * backlinks, a pure knowledge graph, reading/course/research learning trackers,
 * rule-based spaced-repetition flashcards, memory resurfacing and ranked search.
 * Extends — never replaces — the Journal Engine (2.10). No React, no DB, no browser, no
 * tRPC, no AI, no randomness, no embeddings. Phase 5's AI layer consumes this platform
 * without any architectural change.
 */
export * from "./constants";
export * from "./types";
export * from "./schemas";
export * from "./markdown";
export * from "./parser";
export * from "./wiki";
export * from "./backlinks";
export * from "./graph";
export * from "./notes";
export * from "./search";
export * from "./learning";
export * from "./flashcards";
export * from "./resurfacing";
export * from "./review";
export * from "./statistics";
export * from "./portfolio";
export * from "./selectors";
export * from "./engine";
export * from "./fixtures";
