import type { OutboxEntry, OutboxStatus } from "./types";

/**
 * Outbox logic (Stage 8). Pure transforms over the queued-mutation list: ordering,
 * dependency gating, status transitions, retry eligibility. Deterministic — the same
 * outbox always sends in the same order — so the coordinator (which owns IndexedDB + the
 * network) stays a thin shell around this.
 */

export const MAX_ATTEMPTS = 5;

/** Append a new entry with the next sequence number. */
export function enqueue(
  entries: readonly OutboxEntry[],
  entry: Omit<OutboxEntry, "seq">,
): OutboxEntry[] {
  const seq = entries.reduce((max, e) => Math.max(max, e.seq), 0) + 1;
  return [...entries, { ...entry, seq }];
}

/** A dependency is satisfied when it is no longer in the outbox (already synced) or succeeded. */
function depsSatisfied(entry: OutboxEntry, byId: Map<string, OutboxEntry>): boolean {
  return entry.dependsOn.every((id) => {
    const dep = byId.get(id);
    return !dep || dep.status === "succeeded";
  });
}

/** A dependency has permanently failed → the dependent must not be sent. */
function depsBlocked(entry: OutboxEntry, byId: Map<string, OutboxEntry>): boolean {
  return entry.dependsOn.some((id) => byId.get(id)?.status === "failed");
}

/**
 * The entries ready to send now, in deterministic order (seq). Pending, retryable, with
 * all dependencies succeeded and none failed. Never returns an entry whose dependency is
 * still pending — creation must land before the mutation that references its server id.
 */
export function nextSendable(entries: readonly OutboxEntry[]): OutboxEntry[] {
  const byId = new Map(entries.map((e) => [e.clientMutationId, e]));
  return entries
    .filter(
      (e) =>
        (e.status === "pending" || e.status === "failed") &&
        e.attempts < MAX_ATTEMPTS &&
        depsSatisfied(e, byId) &&
        !depsBlocked(e, byId),
    )
    .sort((a, b) => a.seq - b.seq);
}

function setStatus(
  entries: readonly OutboxEntry[],
  id: string,
  status: OutboxStatus,
  patch: Partial<OutboxEntry>,
  now: string,
): OutboxEntry[] {
  return entries.map((e) =>
    e.clientMutationId === id ? { ...e, status, updatedAt: now, ...patch } : e,
  );
}

export function markSyncing(
  entries: readonly OutboxEntry[],
  id: string,
  now: string,
): OutboxEntry[] {
  return setStatus(
    entries,
    id,
    "syncing",
    { attempts: (entries.find((e) => e.clientMutationId === id)?.attempts ?? 0) + 1, error: null },
    now,
  );
}
export function markSucceeded(
  entries: readonly OutboxEntry[],
  id: string,
  now: string,
): OutboxEntry[] {
  return setStatus(entries, id, "succeeded", { error: null }, now);
}
export function markFailed(
  entries: readonly OutboxEntry[],
  id: string,
  error: string,
  now: string,
): OutboxEntry[] {
  return setStatus(entries, id, "failed", { error }, now);
}

/** Remove succeeded entries after acknowledgement (they've reconciled with the server). */
export function pruneSucceeded(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return entries.filter((e) => e.status !== "succeeded");
}

/** Retryable failures (not yet at the attempt ceiling), for the "Retry" action. */
export function retryable(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return entries.filter((e) => e.status === "failed" && e.attempts < MAX_ATTEMPTS);
}

/** Reset failed entries to pending so the coordinator picks them up again. */
export function requeueFailed(entries: readonly OutboxEntry[], now: string): OutboxEntry[] {
  return entries.map((e) =>
    e.status === "failed" ? { ...e, status: "pending" as const, error: null, updatedAt: now } : e,
  );
}
