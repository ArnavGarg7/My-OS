/**
 * Offline sync types (Stage 8). The pure, deterministic model for offline writes — an
 * OUTBOX of queued mutations that survive refresh, replay in order on reconnect, dedup
 * idempotently, and reconcile with the server. No IO here: IndexedDB + tRPC live in the
 * web app; this module owns the logic (ordering, dedup, status, conflict) so it is
 * unit-testable and reusable by a future mobile/native client.
 *
 * Only OFFLINE-SAFE personal operations are queueable. Shared (Stage 7) and external
 * (Stage 4) operations are network-required and never enter the outbox — they fail
 * honestly offline. The op whitelist below is the single source of that truth.
 */

/** The offline-safe operations that may be queued. Everything else requires a connection. */
export const OFFLINE_OPS = [
  "task.create",
  "task.update",
  "task.complete",
  "inbox.capture",
  "journal.create",
  // Focus: the timer is timestamp-based (works offline inherently). These transitions
  // reference a session STARTED online and queue safely. `focus.start` stays online-only
  // (it needs a server-generated session id); starting fully offline is a documented
  // deferral, not faked.
  "focus.pause",
  "focus.resume",
  "focus.complete",
] as const;
export type OfflineOp = (typeof OFFLINE_OPS)[number];

export function isOfflineOp(op: string): op is OfflineOp {
  return (OFFLINE_OPS as readonly string[]).includes(op);
}

/** Lifecycle of a queued mutation. */
export const OUTBOX_STATUSES = ["pending", "syncing", "succeeded", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

/** A durable, replayable mutation. `clientMutationId` is the idempotency key. */
export interface OutboxEntry {
  /** Client-generated idempotency key — the SAME id replayed never duplicates server state. */
  clientMutationId: string;
  op: OfflineOp;
  /** The validated input the server op expects (never contains secrets). */
  payload: Record<string, unknown>;
  status: OutboxStatus;
  /** Monotonic sequence for deterministic ordering (creation order). */
  seq: number;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  /** Other clientMutationIds this entry must not be sent before (e.g. task→its project). */
  dependsOn: string[];
  /** Last error message when failed (for honest UI, never swallowed). */
  error: string | null;
  /** Optional human label for the pending-changes UI ("Task: Finish report"). */
  label: string | null;
}

/** The aggregate sync state the UI shows — always truthful. */
export type SyncState = "online" | "offline" | "syncing" | "synced" | "pending" | "error";

export interface SyncStatus {
  state: SyncState;
  online: boolean;
  pending: number;
  syncing: number;
  failed: number;
  lastSyncAt: string | null;
}
