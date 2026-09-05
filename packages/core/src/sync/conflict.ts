/**
 * Conflict strategy (Stage 8). Deterministic, per-domain — NOT a generic conflict engine.
 *
 * Chosen strategies:
 *  - PERSONAL scalar fields (task status/priority/dueAt, journal body, planner blocks):
 *    field-level LAST-WRITE-WINS keyed by `updatedAt`. Low-risk, single-owner data; the
 *    later timestamp wins per field. The server remains authoritative — the outbox carries
 *    the intended change and the server applies it against current state.
 *  - CREATES (task/inbox/focus/journal): idempotent by `clientMutationId` (see the server
 *    sync ledger), so a replay never duplicates. Creation is not a "conflict".
 *  - SHARED (Stage 7) + EXTERNAL (Stage 4): NOT offline-writable → no client-side conflict
 *    can arise; those operations are network-required and server-authoritative.
 *
 * This module is the documented, testable statement of that policy.
 */

export type ConflictWinner = "local" | "remote" | "equal";

/** Field-level last-write-wins by ISO timestamp. Ties resolve to remote (server-authoritative). */
export function lastWriteWins(localUpdatedAt: string, remoteUpdatedAt: string): ConflictWinner {
  const l = Date.parse(localUpdatedAt);
  const r = Date.parse(remoteUpdatedAt);
  if (Number.isNaN(l) || Number.isNaN(r) || l === r) return "equal";
  return l > r ? "local" : "remote";
}

/** Merge one scalar field deterministically under the LWW policy. */
export function mergeField<T>(
  local: { value: T; updatedAt: string },
  remote: { value: T; updatedAt: string },
): T {
  return lastWriteWins(local.updatedAt, remote.updatedAt) === "local" ? local.value : remote.value;
}
