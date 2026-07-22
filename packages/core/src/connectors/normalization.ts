/**
 * Event Normalization (Sprint 6.4, spec §Event Normalization). The heart of the connector platform:
 * turns a provider's raw payload into the SAME `DomainEvent` the internal Event Engine consumes —
 * "Google: Meeting Cancelled" and "Outlook: Appointment Removed" both become
 * `calendar.meeting_cancelled`. Pure mapping tables; no IO, no AI. A connector never interprets — it
 * only maps "what changed" to a normalized kind + structured payload.
 */
import type { DomainEvent, EventSource } from "../events/types";
import type { NormalizedEvent } from "./types";

export interface NormalizeDeps {
  newId: () => string;
  now: Date;
}

/** A raw payload from a provider (already fetched by the server). */
export interface RawPayload {
  /** The provider's own event type, e.g. "event.cancelled", "pull_request.merged". */
  type: string;
  /** The provider's entity id. */
  externalId: string;
  /** ISO timestamp the change occurred (provider-supplied or fetch time). */
  at: string;
  /** Provider-specific structured fields. */
  fields: Record<string, unknown>;
}

/** Which internal EventSource a provider maps to (external services collapse to `external`). */
const PROVIDER_SOURCE: Record<string, EventSource> = {
  "google-calendar": "calendar",
  gmail: "external",
  github: "external",
  "google-drive": "external",
  slack: "external",
  weather: "external",
};

/** Per-provider raw-type → normalized-kind maps. The ONLY place provider vocab meets our vocab. */
const NORMALIZE_MAP: Record<string, Record<string, string>> = {
  "google-calendar": {
    "event.created": "calendar.meeting_created",
    "event.cancelled": "calendar.meeting_cancelled",
    "event.deleted": "calendar.meeting_cancelled",
    "event.moved": "calendar.meeting_moved",
    "appointment.removed": "calendar.meeting_cancelled", // Outlook vocabulary → same normalized kind
  },
  gmail: {
    "message.important": "gmail.important_email",
    "message.invite": "gmail.calendar_invite",
    "message.bill": "gmail.bill_reminder",
    "message.travel": "gmail.travel_confirmation",
  },
  github: {
    "pull_request.opened": "github.pr_opened",
    "pull_request.merged": "github.pr_merged",
    "pull_request.review_requested": "github.review_requested",
    "issues.assigned": "github.issue_assigned",
    "check_run.failed": "github.ci_failed",
  },
  "google-drive": {
    "file.shared": "drive.file_shared",
    "file.updated": "drive.document_updated",
    "storage.warning": "drive.storage_warning",
  },
  slack: {
    app_mention: "slack.mention",
    "message.thread": "slack.thread_reply",
    "message.im": "slack.direct_message",
    "channel.invite": "slack.channel_invite",
  },
  weather: {
    "forecast.rain": "weather.rain_forecast",
    "forecast.temperature": "weather.temperature_alert",
    "forecast.storm": "weather.storm_warning",
  },
};

/** Normalize one raw payload, or null when the provider/type is unmapped (unknown ⇒ ignored). */
export function normalize(
  providerId: string,
  raw: RawPayload,
  deps: NormalizeDeps,
): NormalizedEvent | null {
  const kind = NORMALIZE_MAP[providerId]?.[raw.type];
  const source = PROVIDER_SOURCE[providerId];
  if (!kind || !source) return null;
  const event: DomainEvent = {
    id: deps.newId(),
    source,
    kind,
    at: raw.at,
    payload: { ...raw.fields, connector: providerId },
    ref: { module: "connector", id: raw.externalId, label: String(raw.fields.label ?? raw.type) },
  };
  return event;
}

/** Normalize a batch (nulls dropped). */
export function normalizeBatch(
  providerId: string,
  raws: readonly RawPayload[],
  deps: NormalizeDeps,
): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  for (const raw of raws) {
    const e = normalize(providerId, raw, deps);
    if (e) out.push(e);
  }
  return out;
}

/** The normalized kinds a provider can produce (for the registry/health views). */
export function normalizedKinds(providerId: string): string[] {
  return Object.values(NORMALIZE_MAP[providerId] ?? {});
}
