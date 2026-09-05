import type { OutboxEntry, SyncStatus } from "./types";

/**
 * Sync-status derivation (Stage 8). The ONE place the truthful connectivity/sync state is
 * computed. It never says "synced" while anything is pending, and never says "online"
 * (clean) while a mutation has failed — the UX honesty rule made deterministic.
 */
export function deriveSyncStatus(
  entries: readonly OutboxEntry[],
  online: boolean,
  lastSyncAt: string | null,
): SyncStatus {
  const pending = entries.filter((e) => e.status === "pending").length;
  const syncing = entries.filter((e) => e.status === "syncing").length;
  const failed = entries.filter((e) => e.status === "failed").length;

  let state: SyncStatus["state"];
  if (!online) state = "offline";
  else if (syncing > 0) state = "syncing";
  else if (failed > 0) state = "error";
  else if (pending > 0) state = "pending";
  else state = "synced";

  return { state, online, pending, syncing, failed, lastSyncAt };
}
