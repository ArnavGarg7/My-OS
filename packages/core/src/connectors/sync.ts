/**
 * Sync Engine + Conflict Resolution (Sprint 6.4, spec §Sync Engine / §Conflict Resolution). Pure,
 * deterministic control: plan a sync from a checkpoint, normalize raw payloads, deduplicate and drop
 * no-ops (e.g. a remote delete of something already gone), and produce the next checkpoint. No IO,
 * no business logic — the server fetches; this shapes the result.
 */
import type { NormalizeDeps, RawPayload } from "./normalization";
import { normalizeBatch } from "./normalization";
import type { NormalizedEvent, SyncPlan, SyncResult } from "./types";

/** Plan a sync: incremental when a checkpoint exists, else a full sync. Deterministic. */
export function planSync(
  accountId: string,
  checkpoint: string | null,
  trigger: SyncPlan["trigger"],
): SyncPlan {
  return {
    accountId,
    mode: checkpoint ? "incremental" : "full",
    fromCheckpoint: checkpoint,
    trigger,
  };
}

/**
 * Resolve a batch of raw payloads into normalized events with deterministic conflict resolution:
 * - dedupe by (kind, externalId) — a provider may resend;
 * - drop no-ops: a `*.cancelled`/`*.deleted` for an id already seen as cancelled in this batch.
 * Returns the events to publish, the count dropped, and the next checkpoint.
 */
export function resolveSync(
  providerId: string,
  raws: readonly RawPayload[],
  deps: NormalizeDeps,
  priorCheckpoint: string | null,
): SyncResult {
  const seen = new Set<string>();
  const cancelledIds = new Set<string>();
  const deduped: RawPayload[] = [];
  for (const raw of raws) {
    const key = `${raw.type}:${raw.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // No-op: a cancel for an id already cancelled in this batch.
    const isCancel = /cancel|delete|remove/i.test(raw.type);
    if (isCancel && cancelledIds.has(raw.externalId)) continue;
    if (isCancel) cancelledIds.add(raw.externalId);
    deduped.push(raw);
  }
  const events: NormalizedEvent[] = normalizeBatch(providerId, deduped, deps);
  const checkpoint = nextCheckpoint(priorCheckpoint, raws, deps.now);
  return { events, dropped: raws.length - events.length, checkpoint };
}

/** Deterministic checkpoint: max(prior, latest payload time, now-as-fallback) as an ISO string. */
function nextCheckpoint(prior: string | null, raws: readonly RawPayload[], now: Date): string {
  const times = [prior, ...raws.map((r) => r.at)].filter(Boolean) as string[];
  const latest = times.reduce((max, t) => (t > max ? t : max), prior ?? "");
  return latest || now.toISOString();
}
