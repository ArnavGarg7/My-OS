import "server-only";
import { randomUUID } from "node:crypto";
import type { Database } from "@myos/db";
import {
  CONNECTOR_PROVIDERS,
  getProvider,
  planSync,
  resolveSync,
  computeHealth,
  transition,
  type ConnectorState,
  type NormalizedEvent,
} from "@myos/core/connectors";
import * as signalsService from "../signals/service";
import { fetchRaw, type LiveFetch } from "./feed";
import { encryptSecret, secretHint } from "./vault";
import { providerLiveAvailable, capabilities as deriveCapabilities } from "./capabilities";
import { writeExternal, writeCapability, type ExternalWriteAction, type LiveWrite } from "./write";
import * as repo from "./repository";

/**
 * Connectors service (Sprint 6.4). Orchestrates the connector platform: connect (encrypt credential +
 * record permissions + lifecycle), sync (plan → fetch → resolve/normalize → persist immutable events →
 * feed the SAME Event-Intelligence cycle), health, metrics, disconnect. **The connector only answers
 * "what changed?" — the Event Engine decides why.** Nothing here interprets events or touches user
 * business data; a connector failure never throws upward into the Event Engine. No AI, deterministic.
 * The live OAuth/HTTP fetch is an injectable seam (`liveFetch`); offline is the default (like AI Local).
 */

const newId = () => randomUUID();

/** connectors.list — every provider + whether it's connected + its accounts + health snapshot. */
export async function list(db: Database) {
  const accounts = await repo.listAccounts(db).catch(() => []);
  const byProvider = new Map<string, typeof accounts>();
  for (const a of accounts) {
    const arr = byProvider.get(a.providerId) ?? [];
    arr.push(a);
    byProvider.set(a.providerId, arr);
  }
  const providers = CONNECTOR_PROVIDERS.map((p) => {
    const connected = (byProvider.get(p.id) ?? []).length > 0;
    const liveAvailable = providerLiveAvailable(p.id);
    return {
      id: p.id,
      provider: p.provider,
      name: p.name,
      category: p.category,
      auth: p.auth,
      syncStrategy: p.syncStrategy,
      webhookCapable: p.webhookCapable,
      readOnly: p.readOnly,
      permissions: p.permissions,
      supportedEvents: p.supportedEvents,
      accounts: (byProvider.get(p.id) ?? []).map((a) => ({
        id: a.id,
        label: a.label,
        state: a.state,
        lastSyncAt: a.lastSyncAt,
      })),
      connected,
      // Honest live/sample labelling: a connection with no configured provider
      // credentials runs against the labelled SAMPLE feed, never real data.
      liveAvailable,
      sample: connected && !liveAvailable,
      canWrite: writeCapability(p.id).supportsWrite,
    };
  });
  return {
    providers,
    connectedCount: accounts.length,
    anyLive: providers.some((p) => p.liveAvailable),
  };
}

/**
 * connectors.connect — create an account, encrypt+store the secret (if supplied), record the granted
 * permission scopes, and move the lifecycle disconnected → authenticating → connected. The plaintext
 * secret is encrypted immediately and never returned or logged.
 */
export async function connect(db: Database, providerId: string, label?: string, secret?: string) {
  const provider = getProvider(providerId);
  if (!provider) return { ok: false as const, error: "unknown_provider" };

  const accountId = await repo.insertAccount(
    db,
    providerId,
    label ?? provider.name,
    "authenticating",
  );

  if (secret) {
    const sealed = encryptSecret(secret);
    await repo
      .insertCredential(db, accountId, sealed, secretHint(secret), provider.permissions)
      .catch(() => {});
  }
  await repo.insertPermissions(db, accountId, provider.permissions).catch(() => {});

  // Explicit lifecycle transition (throws on an illegal move — asserts our own correctness).
  const next: ConnectorState = transition("authenticating", "connected");
  await repo.setAccountState(db, accountId, next);

  return { ok: true as const, accountId, state: next, hint: secret ? secretHint(secret) : null };
}

/** connectors.disconnect — remove the account and its encrypted credential. */
export async function disconnect(db: Database, accountId: string) {
  await repo.deleteAccount(db, accountId).catch(() => {});
  return { ok: true as const };
}

/**
 * Run one sync for an account: plan from the checkpoint, fetch raw (offline feed unless a live seam is
 * injected), resolve/dedupe/normalize into DomainEvents, persist them immutably, record history +
 * health + metrics, and feed the normalized events into the SAME signals cycle. Returns the normalized
 * events. Fully guarded — a connector never interrupts the Event Engine.
 */
export async function sync(
  db: Database,
  accountId: string,
  tz: string,
  trigger: "webhook" | "polling" | "manual" = "manual",
  now = new Date(),
  liveFetch?: LiveFetch,
): Promise<{ ok: boolean; events: NormalizedEvent[]; dropped: number; checkpoint: string | null }> {
  const account = await repo.loadAccount(db, accountId).catch(() => null);
  if (!account) return { ok: false, events: [], dropped: 0, checkpoint: null };
  const provider = getProvider(account.providerId);
  if (!provider) return { ok: false, events: [], dropped: 0, checkpoint: null };

  const started = now.getTime();
  await repo.setAccountState(db, accountId, "syncing").catch(() => {});
  await repo
    .recordSyncJob(db, accountId, account.checkpoint ? "incremental" : "full", trigger, "running")
    .catch(() => {});

  try {
    const plan = planSync(accountId, account.checkpoint, trigger);
    const raws = await fetchRaw(account.providerId, plan.fromCheckpoint, now, liveFetch);
    const result = resolveSync(account.providerId, raws, { newId, now }, account.checkpoint);

    await repo
      .recordEvents(
        db,
        accountId,
        account.providerId,
        result.events.map((e) => ({
          kind: e.kind,
          externalId: e.ref?.id ?? "",
          payload: e.payload,
          occurredAt: new Date(e.at),
        })),
      )
      .catch(() => {});

    const durationMs = Date.now() - started;
    await repo
      .recordSyncHistory(
        db,
        accountId,
        result.events.length,
        result.dropped,
        durationMs,
        true,
        result.checkpoint,
      )
      .catch(() => {});
    await repo.setAccountSync(db, accountId, result.checkpoint, "healthy", now).catch(() => {});

    // Health snapshot for this account.
    const health = computeHealth({
      accountId,
      state: "healthy",
      latencyMs: durationMs,
      syncAgeMinutes: 0,
      failures: 0,
      rateLimited: false,
      lastEventAt: result.events[0]?.at ?? null,
    });
    await repo.recordHealth(db, health).catch(() => {});

    const totalEvents = await repo.countEvents(db, accountId).catch(() => result.events.length);
    await repo
      .recordMetrics(db, accountId, {
        syncs: 1,
        eventsProcessed: result.events.length,
        failures: 0,
        retries: 0,
        avgSyncMs: durationMs,
        rateLimitHits: 0,
      })
      .catch(() => {});
    void totalEvents;

    // Feed the normalized events into the SAME Event-Intelligence cycle. This is the ONLY coupling to
    // the intelligence stack — external events flow through the identical generate→rank→suppress path,
    // producing signals (and downstream predictions/automation) exactly as internal events do.
    await signalsService.run(db, tz, result.events, now).catch(() => {});

    return {
      ok: true,
      events: result.events,
      dropped: result.dropped,
      checkpoint: result.checkpoint,
    };
  } catch {
    const durationMs = Date.now() - started;
    await repo
      .recordSyncHistory(db, accountId, 0, 0, durationMs, false, account.checkpoint ?? "")
      .catch(() => {});
    await repo.setAccountState(db, accountId, "warning").catch(() => {});
    return { ok: false, events: [], dropped: 0, checkpoint: account.checkpoint };
  }
}

/** connectors.health — the latest health per account, banded. */
export async function health(db: Database) {
  const accounts = await repo.listAccounts(db).catch(() => []);
  const now = Date.now();
  const items = accounts.map((a) => {
    const ageMin = a.lastSyncAt
      ? Math.round((now - new Date(a.lastSyncAt).getTime()) / 60000)
      : 999;
    const h = computeHealth({
      accountId: a.id,
      state: a.state,
      latencyMs: 0,
      syncAgeMinutes: a.lastSyncAt ? ageMin : 0,
      failures: 0,
      rateLimited: false,
      lastEventAt: null,
    });
    return {
      accountId: a.id,
      providerId: a.providerId,
      label: a.label,
      state: a.state,
      score: h.score,
      syncAgeMinutes: h.syncAgeMinutes,
      reasons: h.reasons,
      lastSyncAt: a.lastSyncAt,
    };
  });
  return { items };
}

/** connectors.events — recent normalized events (optionally by account), sample-tagged. */
export async function events(db: Database, accountId?: string) {
  const rows = await repo.listEvents(db, accountId).catch(() => []);
  return { events: rows.map((r) => ({ ...r, sample: !providerLiveAvailable(r.providerKey) })) };
}

/** connectors.permissions — granted scopes for an account. */
export async function permissions(db: Database, accountId: string) {
  const provider = getProvider(
    (await repo.loadAccount(db, accountId).catch(() => null))?.providerId ?? "",
  );
  const granted = await repo.listPermissions(db, accountId).catch(() => []);
  return { permissions: granted, readOnly: provider?.readOnly ?? true };
}

/** connectors.syncHistory — recent runs (optionally by account). */
export async function syncHistory(db: Database, accountId?: string) {
  return { history: await repo.listSyncHistory(db, accountId).catch(() => []) };
}

/** connectors.metrics — aggregate connector analytics. */
export async function metrics(db: Database) {
  const rows = await repo.latestMetrics(db).catch(() => []);
  const totals = rows.reduce(
    (acc, r) => ({
      syncs: acc.syncs + r.syncs,
      eventsProcessed: acc.eventsProcessed + r.eventsProcessed,
      failures: acc.failures + r.failures,
      retries: acc.retries + r.retries,
      rateLimitHits: acc.rateLimitHits + r.rateLimitHits,
    }),
    { syncs: 0, eventsProcessed: 0, failures: 0, retries: 0, rateLimitHits: 0 },
  );
  const avgSyncMs = rows.length ? rows.reduce((s, r) => s + r.avgSyncMs, 0) / rows.length : 0;
  return { totals: { ...totals, avgSyncMs }, recent: rows };
}

/** connectors.settings — registry-level configuration surface. */
export async function settings(db: Database) {
  const accounts = await repo.listAccounts(db).catch(() => []);
  const caps = deriveCapabilities();
  return {
    providers: CONNECTOR_PROVIDERS.length,
    connected: accounts.length,
    readOnly: true,
    // Honest: are any providers configured for a real (live) connection?
    liveConfigured: caps.filter((c) => c.liveAvailable).length,
  };
}

/** connectors.capabilities — per-provider live availability + what a live connection needs. */
export function capabilities() {
  return { providers: deriveCapabilities() };
}

/**
 * EXTERNAL → OS calendar bridge (Stage 4). Surfaces the normalized calendar
 * change-events from connected calendar accounts so external calendar activity
 * participates in the operating model (Calendar shows it; Chief/Signals already
 * consume the same events via the sync seam). Read-only, source-tagged, and
 * marked `sample` when the account has no live credentials — never presented as a
 * real schedule it isn't. Honest empty when no calendar is connected.
 */
export async function calendarActivity(db: Database, limit = 20) {
  const accounts = await repo.listAccounts(db).catch(() => []);
  const calendarProviderIds = new Set(
    CONNECTOR_PROVIDERS.filter((p) => p.category === "calendar").map((p) => p.id),
  );
  const connectedCalendar = accounts.filter((a) => calendarProviderIds.has(a.providerId));
  if (connectedCalendar.length === 0)
    return { connected: false, items: [] as CalendarActivityItem[] };

  const rows = await repo.listEvents(db, undefined, 100).catch(() => []);
  const items: CalendarActivityItem[] = rows
    .filter((r) => r.kind.startsWith("calendar."))
    .slice(0, limit)
    .map((r) => ({
      externalId: r.externalId,
      kind: r.kind,
      label: String(r.payload.label ?? r.kind),
      occurredAt: new Date(r.occurredAt).toISOString(),
      providerKey: r.providerKey,
      sample: !providerLiveAvailable(r.providerKey),
    }));
  return { connected: true, items };
}

export interface CalendarActivityItem {
  externalId: string;
  kind: string;
  label: string;
  occurredAt: string;
  providerKey: string;
  sample: boolean;
}

/**
 * MY OS → EXTERNAL: create a calendar event on a connected provider. Goes through
 * the permission-gated write seam; with no live credentials the honest result is
 * `{ ok:false, reason:"no_live_credentials" }` — never a fabricated success.
 */
export async function createCalendarEvent(
  db: Database,
  input: {
    providerId?: string | undefined;
    title: string;
    startAt: string;
    endAt?: string | undefined;
  },
  liveWrite?: LiveWrite,
) {
  const providerId = input.providerId ?? "google-calendar";
  const action: ExternalWriteAction = "calendar.create";
  return writeExternal(
    db,
    providerId,
    action,
    { title: input.title, startAt: input.startAt, endAt: input.endAt ?? null },
    liveWrite,
  );
}

/**
 * Signals seam (Sprint 6.4). Gather the normalized events from every connected account WITHOUT running
 * a sync — used so the Event-Intelligence cycle can fold in external events. Guarded → []. Returns
 * DomainEvents ready for `signals/service.run(db, tz, extraEvents)`.
 */
export async function connectorEventsForSignals(
  db: Database,
  limit = 20,
): Promise<NormalizedEvent[]> {
  try {
    const rows = await repo.listEvents(db, undefined, limit);
    return rows.map((r) => ({
      id: newId(),
      source: r.providerKey === "google-calendar" ? "calendar" : "external",
      kind: r.kind,
      at: r.occurredAt,
      payload: r.payload,
      ref: { module: "connector", id: r.externalId, label: String(r.payload.label ?? r.kind) },
    }));
  } catch {
    return [];
  }
}
