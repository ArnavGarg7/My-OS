/**
 * Connector Platform — types (Sprint 6.4, Phase 6). The provider-agnostic framework that turns
 * external services (Google Calendar, Gmail, GitHub, Weather, Slack, Drive…) into NORMALIZED events
 * feeding the existing Event Intelligence → Prediction → Automation → Chief pipeline. Pure: no IO, no
 * clock (time injected), no AI. **A connector never decides what something means — it only answers
 * "what changed?".** The Event Engine decides "why it matters".
 */
import type { DomainEvent } from "../events/types";

/** A connector normalizes external raw payloads into the SAME DomainEvent the internal engine uses. */
export type NormalizedEvent = DomainEvent;

/** How a connector obtains data. Read-first, read-only tokens where possible. */
export type AuthKind = "oauth2" | "api_key" | "personal_token" | "ics_url" | "none";

/** How a connector receives changes. */
export type SyncStrategy = "webhook" | "polling" | "manual";

/** The connector lifecycle (spec §Connector Lifecycle). All transitions explicit. */
export type ConnectorState =
  "disconnected" | "authenticating" | "connected" | "syncing" | "healthy" | "warning" | "failed";

/** A registered connector provider descriptor. Immutable data. */
export interface ConnectorProvider {
  id: string;
  provider: string;
  name: string;
  category: "calendar" | "email" | "code" | "storage" | "chat" | "weather";
  version: string;
  auth: AuthKind;
  /** Least-privilege scopes requested. */
  permissions: string[];
  /** The normalized event kinds this connector can emit. */
  supportedEvents: string[];
  syncStrategy: SyncStrategy;
  /** Whether the provider offers webhooks (else polling). */
  webhookCapable: boolean;
  /** Read-only (Sprint 6.4 is read-first). */
  readOnly: boolean;
}

/** A user's connection to a provider (an account). */
export interface ConnectorAccount {
  id: string;
  providerId: string;
  label: string;
  state: ConnectorState;
  /** Opaque sync cursor for incremental sync (checkpoint). */
  checkpoint: string | null;
  lastSyncAt: string | null;
  createdAt: string;
}

/** A deterministic plan for one sync run. */
export interface SyncPlan {
  accountId: string;
  mode: "incremental" | "full";
  /** The checkpoint to resume from (null = full). */
  fromCheckpoint: string | null;
  /** Whether a webhook or a poll triggers it. */
  trigger: SyncStrategy;
}

/** The result of normalizing a batch of raw provider payloads. */
export interface SyncResult {
  events: NormalizedEvent[];
  /** Duplicates/no-ops dropped by conflict resolution. */
  dropped: number;
  /** The new checkpoint after this run. */
  checkpoint: string;
}

/** A connector's health snapshot (spec §Connector Health). */
export interface ConnectorHealth {
  accountId: string;
  state: ConnectorState;
  /** 0..100 composite health score. */
  score: number;
  latencyMs: number;
  /** Minutes since the last successful sync. */
  syncAgeMinutes: number;
  failures: number;
  rateLimited: boolean;
  lastEventAt: string | null;
  reasons: string[];
}

/** Aggregate connector analytics. */
export interface ConnectorMetrics {
  syncs: number;
  eventsProcessed: number;
  failures: number;
  retries: number;
  avgSyncMs: number;
  rateLimitHits: number;
}
