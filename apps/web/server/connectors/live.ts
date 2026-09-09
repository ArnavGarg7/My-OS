import "server-only";
import type { Database } from "@myos/db";
import type { RawPayload } from "@myos/core/connectors";
import type { LiveFetch } from "./feed";
import { decryptSecret, encryptSecret, type Sealed } from "./vault";
import { refreshTokens, type TokenBundle } from "./oauth";
import * as repo from "./repository";

/**
 * Live connector fetch (Stage B). Turns a connected account's stored OAuth token bundle into real
 * "what changed?" payloads in the provider's own vocabulary — the SAME `RawPayload` shape the offline
 * sample feed produces, so normalization → events → signals downstream is byte-identical. Handles
 * silent token refresh (re-sealing the bundle) and never throws upward (the connector must not
 * interrupt the Event Engine). Only providers with a fetcher here go live; others fall to sample.
 */

interface LiveAccount {
  id: string;
  providerId: string;
}

/** Load, refresh-if-expiring, and re-store an account's access token. Null when unavailable. */
async function getFreshAccessToken(db: Database, account: LiveAccount): Promise<string | null> {
  const cred = await repo.loadCredential(db, account.id).catch(() => null);
  if (!cred) return null;
  let bundle: TokenBundle;
  try {
    bundle = JSON.parse(decryptSecret(cred.sealed)) as TokenBundle;
  } catch {
    return null;
  }
  const expiringSoon =
    bundle.expiresAt !== null && new Date(bundle.expiresAt).getTime() - Date.now() < 60_000;
  if (expiringSoon && bundle.refreshToken) {
    const refreshed = await refreshTokens(account.providerId, bundle.refreshToken).catch(
      () => null,
    );
    if (refreshed?.accessToken) {
      bundle = refreshed;
      const sealed: Sealed = encryptSecret(JSON.stringify(bundle));
      await repo.updateCredential(db, account.id, sealed, "•••live").catch(() => {});
    }
  }
  return bundle.accessToken || null;
}

// ── Provider fetchers (provider vocabulary → RawPayload) ──────────────────────────────────────

/** Google Calendar: recently-updated events since the checkpoint → calendar change payloads. */
async function fetchGoogleCalendar(
  token: string,
  checkpoint: string | null,
): Promise<RawPayload[]> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "updated",
    showDeleted: "true",
    maxResults: "25",
  });
  if (checkpoint) params.set("updatedMin", checkpoint);
  else params.set("timeMin", new Date(Date.now() - 30 * 86_400_000).toISOString());

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: GoogleEvent[] };
  return (data.items ?? []).flatMap((e) => {
    if (!e.id || !e.updated) return [];
    const cancelled = e.status === "cancelled";
    const start = e.start?.dateTime ?? e.start?.date ?? null;
    const end = e.end?.dateTime ?? e.end?.date ?? null;
    const minutes =
      start && end ? Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60_000)) : null;
    return [
      {
        type: cancelled ? "event.cancelled" : "event.created",
        externalId: e.id,
        at: e.updated,
        fields: {
          label: e.summary ?? "(untitled event)",
          ...(start ? { startsAt: start } : {}),
          ...(minutes !== null ? { minutes } : {}),
        },
      } satisfies RawPayload,
    ];
  });
}

interface GoogleEvent {
  id?: string;
  status?: string;
  summary?: string;
  updated?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

const FETCHERS: Record<
  string,
  (token: string, checkpoint: string | null) => Promise<RawPayload[]>
> = {
  "google-calendar": fetchGoogleCalendar,
};

/** Whether a real (non-sample) live fetcher is implemented for this provider. */
export function hasLiveFetcher(providerId: string): boolean {
  return providerId in FETCHERS;
}

/** Build a LiveFetch bound to an account (loads + refreshes its token per call). Null if none. */
export function makeLiveFetch(db: Database, account: LiveAccount): LiveFetch | null {
  const fetcher = FETCHERS[account.providerId];
  if (!fetcher) return null;
  return async (providerId, checkpoint) => {
    const token = await getFreshAccessToken(db, account);
    if (!token) return [];
    return fetcher(token, checkpoint);
  };
}
