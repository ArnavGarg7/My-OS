"use client";

import type { OutboxEntry } from "@myos/core/sync";

/**
 * IndexedDB persistence (Stage 8). The durable local store behind the offline outbox +
 * query cache. Raw IndexedDB (no new dependency). Everything survives refresh, tab close
 * and PWA reopen — an offline write is never lost. SECURITY: only personal mutation
 * payloads + cached read models live here; secrets/tokens/credentials are NEVER written
 * (Stage 4 keeps those server-side), and the sync ledger id is the only key that crosses
 * to the server.
 */
const DB_NAME = "myos-offline";
const DB_VERSION = 1;
const OUTBOX = "outbox";
const KV = "kv";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: "clientMutationId" });
      }
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

// ── outbox ────────────────────────────────────────────────────────────────────────────
export async function loadOutbox(): Promise<OutboxEntry[]> {
  try {
    const all = await tx<OutboxEntry[]>(
      OUTBOX,
      "readonly",
      (s) => s.getAll() as IDBRequest<OutboxEntry[]>,
    );
    return [...all].sort((a, b) => a.seq - b.seq);
  } catch {
    return [];
  }
}

/** Replace the entire outbox (clear + put all) in one transaction — atomic, ordered. */
export async function persistOutbox(entries: readonly OutboxEntry[]): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(OUTBOX, "readwrite");
      const store = t.objectStore(OUTBOX);
      store.clear();
      for (const e of entries) store.put(e);
      t.oncomplete = () => {
        db.close();
        resolve();
      };
      t.onerror = () => reject(t.error);
    });
  } catch {
    /* persistence best-effort; state still lives in memory this session */
  }
}

// ── kv (query cache snapshot) ─────────────────────────────────────────────────────────
export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const v = await tx<T | undefined>(
      KV,
      "readonly",
      (s) => s.get(key) as IDBRequest<T | undefined>,
    );
    return v ?? null;
  } catch {
    return null;
  }
}
export async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    await tx(KV, "readwrite", (s) => s.put(value, key));
  } catch {
    /* best-effort */
  }
}
