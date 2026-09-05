"use client";

/**
 * Offline layer (Stage 8) — the durable outbox + sync coordinator + query persistence that
 * make My OS usable without connectivity. One outbox, one coordinator; the pure logic lives
 * in @myos/core/sync. Features enqueue offline-safe personal mutations through `useOffline`.
 */
export { OfflineProvider, useOffline, useOptionalOffline } from "./offline-provider";
export { QueryPersistence } from "./query-persist";
