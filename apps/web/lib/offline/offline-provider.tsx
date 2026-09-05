"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deriveSyncStatus,
  enqueue as enqueueEntry,
  markFailed,
  markSucceeded,
  markSyncing,
  nextSendable,
  pruneSucceeded,
  requeueFailed,
  type OfflineOp,
  type OutboxEntry,
  type SyncStatus,
} from "@myos/core/sync";
import { loadOutbox, persistOutbox } from "./idb";

/**
 * Offline coordinator (Stage 8). Owns the durable outbox + the replay loop. When online it
 * drains pending mutations through the idempotent `sync.apply` endpoint (in dependency
 * order, one at a time); when offline it holds them safely. State is always truthful —
 * `status` never says "synced" while anything is pending. The app has ONE outbox and ONE
 * coordinator; features enqueue through `useOffline()`.
 *
 * The tRPC client uses no data transformer, so a mutation is a plain POST with body
 * `{ "0": input }` and the result is at `[0].result.data`.
 */

interface OfflineContextValue {
  status: SyncStatus;
  entries: OutboxEntry[];
  /** Queue an offline-safe mutation. Runs `optimistic` immediately; syncs now if online. */
  enqueue: (
    op: OfflineOp,
    payload: Record<string, unknown>,
    opts?: { label?: string; dependsOn?: string[]; optimistic?: () => void },
  ) => string;
  retry: () => void;
  syncNow: () => void;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

async function callApply(entry: OutboxEntry): Promise<void> {
  const res = await fetch("/api/trpc/sync.run?batch=1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      0: { clientMutationId: entry.clientMutationId, op: entry.op, payload: entry.payload },
    }),
  });
  const body = (await res.json()) as Array<{
    result?: unknown;
    error?: { json?: { message?: string } };
  }>;
  const item = body?.[0];
  if (!res.ok || item?.error) {
    throw new Error(item?.error?.json?.message ?? `Sync failed (${res.status})`);
  }
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [online, setOnline] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const entriesRef = useRef<OutboxEntry[]>([]);
  const syncingRef = useRef(false);

  /** Single writer: update ref + state + durable store together. */
  const commit = useCallback((next: OutboxEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
    void persistOutbox(next);
  }, []);

  // Load the durable outbox once (survives refresh / reopen).
  useEffect(() => {
    void loadOutbox().then((loaded) => {
      // Any mutation caught mid-flight last session is retried, not lost.
      const revived = loaded.map((e) =>
        e.status === "syncing" ? { ...e, status: "pending" as const } : e,
      );
      entriesRef.current = revived;
      setEntries(revived);
    });
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const ready = nextSendable(entriesRef.current);
    if (ready.length === 0) return;
    syncingRef.current = true;
    let anySucceeded = false;
    try {
      for (const entry of ready) {
        commit(markSyncing(entriesRef.current, entry.clientMutationId, new Date().toISOString()));
        try {
          await callApply(entry);
          commit(
            markSucceeded(entriesRef.current, entry.clientMutationId, new Date().toISOString()),
          );
          anySucceeded = true;
        } catch (err) {
          commit(
            markFailed(
              entriesRef.current,
              entry.clientMutationId,
              err instanceof Error ? err.message : "Unknown error",
              new Date().toISOString(),
            ),
          );
        }
      }
    } finally {
      if (anySucceeded) {
        commit(pruneSucceeded(entriesRef.current));
        setLastSyncAt(new Date().toISOString());
        // Reconcile: pull fresh server state for the views the sync touched.
        void queryClient.invalidateQueries();
      }
      syncingRef.current = false;
    }
  }, [commit, queryClient]);

  // Online/offline transitions; drain the outbox on reconnect.
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [syncNow]);

  const enqueue = useCallback<OfflineContextValue["enqueue"]>(
    (op, payload, opts) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const entry: Omit<OutboxEntry, "seq"> = {
        clientMutationId: id,
        op,
        payload,
        status: "pending",
        attempts: 0,
        createdAt: now,
        updatedAt: now,
        dependsOn: opts?.dependsOn ?? [],
        error: null,
        label: opts?.label ?? null,
      };
      commit(enqueueEntry(entriesRef.current, entry));
      opts?.optimistic?.();
      if (typeof navigator === "undefined" || navigator.onLine) void syncNow();
      return id;
    },
    [commit, syncNow],
  );

  const retry = useCallback(() => {
    commit(requeueFailed(entriesRef.current, new Date().toISOString()));
    void syncNow();
  }, [commit, syncNow]);

  const status = useMemo(
    () => deriveSyncStatus(entries, online, lastSyncAt),
    [entries, online, lastSyncAt],
  );

  const value = useMemo<OfflineContextValue>(
    () => ({ status, entries, enqueue, retry, syncNow: () => void syncNow() }),
    [status, entries, enqueue, retry, syncNow],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}

/** Non-throwing variant for components that may render outside the provider (e.g. tests). */
export function useOptionalOffline(): OfflineContextValue | null {
  return useContext(OfflineContext);
}
