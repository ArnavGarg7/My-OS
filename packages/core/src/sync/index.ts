/**
 * @myos/core/sync (Stage 8) — the pure offline-write model. An outbox of queued personal
 * mutations that survive refresh, replay in deterministic order on reconnect, dedup
 * idempotently by `clientMutationId`, and reconcile with the server. No IO — IndexedDB and
 * tRPC live in the web app; this owns ordering, dependency gating, status and conflict so
 * the same logic can back a future native/mobile client. Offline is a capability of the
 * one OS, not a second OS: only whitelisted PERSONAL ops are queueable; shared/external
 * operations remain network-required and fail honestly offline.
 */
export * from "./types";
export * from "./outbox";
export * from "./status";
export * from "./conflict";
