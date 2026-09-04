/**
 * @myos/core/collaboration (Stage 7) — "My OS with other people".
 *
 * PURE, dependency-free domain for people, shared membership, object-attached
 * conversations, mentions, invitations and collaboration activity. It owns the
 * deterministic AUTHORIZATION model (the single definition of who may do what in a
 * shared context) and the privacy invariant: personal objects (no project) are
 * owner-only, so personal tasks/journal/health/intelligence can never be reached by a
 * collaborator. No AI, no IO, no realtime here — the server maps this onto the existing
 * Notification, Timeline and Decision engines.
 */
export * from "./constants";
export * from "./types";
export * from "./authorization";
export * from "./mentions";
export * from "./messages";
export * from "./invitations";
export * from "./activity";
