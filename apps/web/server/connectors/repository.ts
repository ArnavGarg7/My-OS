import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  connectorAccounts,
  connectorCredentials,
  connectorEvents,
  connectorHealth,
  connectorMetrics,
  connectorPermissions,
  connectorSyncHistory,
  connectorSyncJobs,
} from "@myos/db/schema";
import type { ConnectorAccount, ConnectorHealth, ConnectorState } from "@myos/core/connectors";
import type { Sealed } from "./vault";

/**
 * Connectors repository (Sprint 6.4). Persists accounts, ENCRYPTED credentials, sync jobs/history,
 * immutable normalized events, health, permissions and metrics. Credential plaintext NEVER enters or
 * leaves here — only sealed ciphertext. Sync history + events are append-only; only an account's
 * lifecycle `state`/`checkpoint`/`lastSyncAt` are updated.
 */

function rowToAccount(r: typeof connectorAccounts.$inferSelect): ConnectorAccount {
  return {
    id: r.id,
    providerId: r.providerKey,
    label: r.label,
    state: r.state as ConnectorState,
    checkpoint: r.checkpoint,
    lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function insertAccount(
  db: Database,
  providerKey: string,
  label: string,
  state: ConnectorState,
): Promise<string> {
  const [row] = await db
    .insert(connectorAccounts)
    .values({ providerKey, label, state })
    .returning({ id: connectorAccounts.id });
  return row!.id;
}

export async function loadAccount(db: Database, id: string): Promise<ConnectorAccount | null> {
  const [row] = await db
    .select()
    .from(connectorAccounts)
    .where(eq(connectorAccounts.id, id))
    .limit(1);
  return row ? rowToAccount(row) : null;
}

export async function listAccounts(db: Database): Promise<ConnectorAccount[]> {
  const rows = await db.select().from(connectorAccounts).orderBy(desc(connectorAccounts.createdAt));
  return rows.map(rowToAccount);
}

export async function setAccountState(
  db: Database,
  id: string,
  state: ConnectorState,
): Promise<void> {
  await db.update(connectorAccounts).set({ state }).where(eq(connectorAccounts.id, id));
}

export async function setAccountSync(
  db: Database,
  id: string,
  checkpoint: string,
  state: ConnectorState,
  at: Date,
): Promise<void> {
  await db
    .update(connectorAccounts)
    .set({ checkpoint, state, lastSyncAt: at })
    .where(eq(connectorAccounts.id, id));
}

export async function deleteAccount(db: Database, id: string): Promise<void> {
  // Delete credentials FIRST (secrets must not outlive the account), then the account.
  await db.delete(connectorCredentials).where(eq(connectorCredentials.accountId, id));
  await db.delete(connectorAccounts).where(eq(connectorAccounts.id, id));
}

/** Store an encrypted credential (sealed ciphertext only). */
export async function insertCredential(
  db: Database,
  accountId: string,
  sealed: Sealed,
  hint: string,
  scopes: string[],
): Promise<void> {
  await db.insert(connectorCredentials).values({
    accountId,
    ciphertext: sealed.ciphertext,
    iv: sealed.iv,
    tag: sealed.tag,
    hint,
    scopes,
  });
}

/** Load a sealed credential for the SYNC path only. Returns ciphertext, never plaintext. */
export async function loadCredential(
  db: Database,
  accountId: string,
): Promise<{ sealed: Sealed; hint: string } | null> {
  const [row] = await db
    .select()
    .from(connectorCredentials)
    .where(eq(connectorCredentials.accountId, accountId))
    .limit(1);
  if (!row) return null;
  return { sealed: { ciphertext: row.ciphertext, iv: row.iv, tag: row.tag }, hint: row.hint };
}

/** The non-secret credential hint for display (never the secret). */
export async function credentialHint(db: Database, accountId: string): Promise<string | null> {
  const [row] = await db
    .select({ hint: connectorCredentials.hint })
    .from(connectorCredentials)
    .where(eq(connectorCredentials.accountId, accountId))
    .limit(1);
  return row?.hint ?? null;
}

export async function recordSyncJob(
  db: Database,
  accountId: string,
  mode: string,
  trigger: string,
  status: string,
): Promise<void> {
  await db.insert(connectorSyncJobs).values({ accountId, mode, trigger, status });
}

export async function recordSyncHistory(
  db: Database,
  accountId: string,
  eventsProcessed: number,
  dropped: number,
  durationMs: number,
  ok: boolean,
  checkpoint: string,
): Promise<void> {
  await db
    .insert(connectorSyncHistory)
    .values({ accountId, eventsProcessed, dropped, durationMs, ok, checkpoint });
}

export async function listSyncHistory(db: Database, accountId?: string, limit = 50) {
  const q = db
    .select()
    .from(connectorSyncHistory)
    .orderBy(desc(connectorSyncHistory.at))
    .limit(limit);
  const rows = accountId
    ? await db
        .select()
        .from(connectorSyncHistory)
        .where(eq(connectorSyncHistory.accountId, accountId))
        .orderBy(desc(connectorSyncHistory.at))
        .limit(limit)
    : await q;
  return rows.map((r) => ({
    accountId: r.accountId,
    eventsProcessed: r.eventsProcessed,
    dropped: r.dropped,
    durationMs: r.durationMs,
    ok: r.ok,
    checkpoint: r.checkpoint,
    at: r.at.toISOString(),
  }));
}

/** Append immutable normalized events. */
export async function recordEvents(
  db: Database,
  accountId: string,
  providerKey: string,
  events: {
    kind: string;
    externalId: string;
    payload: Record<string, unknown>;
    occurredAt: Date;
  }[],
): Promise<void> {
  if (events.length === 0) return;
  await db.insert(connectorEvents).values(
    events.map((e) => ({
      accountId,
      providerKey,
      kind: e.kind,
      externalId: e.externalId,
      payload: e.payload,
      occurredAt: e.occurredAt,
    })),
  );
}

export async function listEvents(db: Database, accountId?: string, limit = 50) {
  const rows = accountId
    ? await db
        .select()
        .from(connectorEvents)
        .where(eq(connectorEvents.accountId, accountId))
        .orderBy(desc(connectorEvents.occurredAt))
        .limit(limit)
    : await db
        .select()
        .from(connectorEvents)
        .orderBy(desc(connectorEvents.occurredAt))
        .limit(limit);
  return rows.map((r) => ({
    accountId: r.accountId,
    providerKey: r.providerKey,
    kind: r.kind,
    externalId: r.externalId,
    payload: r.payload,
    occurredAt: r.occurredAt.toISOString(),
  }));
}

/** How many events an account has ever emitted (for metrics/health). */
export async function countEvents(db: Database, accountId: string): Promise<number> {
  const rows = await db
    .select({ id: connectorEvents.id })
    .from(connectorEvents)
    .where(eq(connectorEvents.accountId, accountId));
  return rows.length;
}

export async function recordHealth(db: Database, h: ConnectorHealth): Promise<void> {
  await db.insert(connectorHealth).values({
    accountId: h.accountId,
    state: h.state,
    score: h.score,
    latencyMs: h.latencyMs,
    syncAgeMinutes: h.syncAgeMinutes,
    failures: h.failures,
    rateLimited: h.rateLimited,
    reasons: h.reasons,
  });
}

export async function insertPermissions(
  db: Database,
  accountId: string,
  permissions: string[],
): Promise<void> {
  if (permissions.length === 0) return;
  await db
    .insert(connectorPermissions)
    .values(permissions.map((permission) => ({ accountId, permission })));
}

export async function listPermissions(db: Database, accountId: string): Promise<string[]> {
  const rows = await db
    .select({ permission: connectorPermissions.permission })
    .from(connectorPermissions)
    .where(eq(connectorPermissions.accountId, accountId));
  return rows.map((r) => r.permission);
}

export async function recordMetrics(
  db: Database,
  accountId: string,
  m: {
    syncs: number;
    eventsProcessed: number;
    failures: number;
    retries: number;
    avgSyncMs: number;
    rateLimitHits: number;
  },
): Promise<void> {
  await db.insert(connectorMetrics).values({ accountId, ...m });
}

export async function latestMetrics(db: Database) {
  const rows = await db
    .select()
    .from(connectorMetrics)
    .orderBy(desc(connectorMetrics.createdAt))
    .limit(20);
  return rows.map((r) => ({
    accountId: r.accountId,
    syncs: r.syncs,
    eventsProcessed: r.eventsProcessed,
    failures: r.failures,
    retries: r.retries,
    avgSyncMs: r.avgSyncMs,
    rateLimitHits: r.rateLimitHits,
    at: r.createdAt.toISOString(),
  }));
}
