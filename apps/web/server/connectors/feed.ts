import "server-only";
import type { RawPayload } from "@myos/core/connectors";

/**
 * Provider feed adapter (Sprint 6.4). The seam where a connector fetches "what changed" from an
 * external service. In Sprint 6.4 this runs OFFLINE by default (mirroring the AI Local provider): with
 * no live OAuth/HTTP credentials, it returns a small deterministic set of raw payloads so the full
 * pipeline — normalize → event → signal → prediction → Chief — is exercisable end-to-end without a
 * network. When real credentials are present, `liveFetch` (the injected seam) replaces this; the
 * downstream normalization is IDENTICAL either way. **No business logic, no interpretation here** —
 * this only answers "what changed?" in the provider's own vocabulary.
 */

export type LiveFetch = (providerId: string, checkpoint: string | null) => Promise<RawPayload[]>;

/** Deterministic offline sample payloads per provider (provider vocabulary, pre-normalization). */
const OFFLINE_FEED: Record<string, (now: Date) => RawPayload[]> = {
  "google-calendar": (now) => [
    {
      type: "event.cancelled",
      externalId: "gc-evt-001",
      at: now.toISOString(),
      fields: { minutes: 60, label: "Weekly Sync", startsAt: now.toISOString() },
    },
  ],
  gmail: (now) => [
    {
      type: "message.important",
      externalId: "gm-msg-014",
      at: now.toISOString(),
      fields: { label: "Q3 planning — action needed", from: "team@work.example" },
    },
  ],
  github: (now) => [
    {
      type: "check_run.failed",
      externalId: "gh-ci-882",
      at: now.toISOString(),
      fields: { label: "build (node 20)", repo: "myos/app" },
    },
    {
      type: "pull_request.review_requested",
      externalId: "gh-pr-77",
      at: now.toISOString(),
      fields: { label: "Fix connector health scoring", repo: "myos/app" },
    },
  ],
  "google-drive": (now) => [
    {
      type: "file.shared",
      externalId: "gd-file-31",
      at: now.toISOString(),
      fields: { label: "2026 Roadmap.doc" },
    },
  ],
  slack: (now) => [
    {
      type: "app_mention",
      externalId: "sl-msg-501",
      at: now.toISOString(),
      fields: { label: "#engineering", from: "alex" },
    },
  ],
  weather: (now) => [
    {
      type: "forecast.rain",
      externalId: "wx-fc-tomorrow",
      at: now.toISOString(),
      fields: { when: "tomorrow", label: "Rain expected" },
    },
  ],
};

/**
 * Fetch raw payloads for a provider. Uses the injected `liveFetch` when credentials are present
 * (real sync), else the deterministic offline feed. Failures NEVER throw upward — the connector
 * platform must never interrupt the Event Engine — so a live-fetch error yields an empty batch.
 */
export async function fetchRaw(
  providerId: string,
  checkpoint: string | null,
  now: Date,
  liveFetch?: LiveFetch,
): Promise<RawPayload[]> {
  if (liveFetch) {
    try {
      return await liveFetch(providerId, checkpoint);
    } catch {
      return [];
    }
  }
  const gen = OFFLINE_FEED[providerId];
  return gen ? gen(now) : [];
}
