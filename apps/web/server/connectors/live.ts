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

/** GitHub notification `reason` → our raw event vocabulary (only the clearly-mapped ones). */
const GITHUB_REASON_TO_TYPE: Record<string, string> = {
  review_requested: "pull_request.review_requested",
  assign: "issues.assigned",
  ci_activity: "check_run.failed",
};

/** GitHub: unread notification threads since the checkpoint → PR/issue/CI change payloads. */
async function fetchGitHub(token: string, checkpoint: string | null): Promise<RawPayload[]> {
  const params = new URLSearchParams({ all: "false", per_page: "25" });
  if (checkpoint) params.set("since", checkpoint);
  const res = await fetch(`https://api.github.com/notifications?${params.toString()}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  });
  if (!res.ok) return [];
  const threads = (await res.json()) as GitHubThread[];
  return (Array.isArray(threads) ? threads : []).flatMap((t) => {
    const type = t.reason ? GITHUB_REASON_TO_TYPE[t.reason] : undefined;
    if (!type || !t.id || !t.updated_at) return [];
    return [
      {
        type,
        externalId: t.id,
        at: t.updated_at,
        fields: {
          label: t.subject?.title ?? t.reason ?? "GitHub update",
          ...(t.repository?.full_name ? { repo: t.repository.full_name } : {}),
        },
      } satisfies RawPayload,
    ];
  });
}

interface GitHubThread {
  id?: string;
  reason?: string;
  updated_at?: string;
  subject?: { title?: string; type?: string };
  repository?: { full_name?: string };
}

/** Gmail: important + unread messages (last 14 days) newer than the checkpoint → email payloads. */
async function fetchGmail(token: string, checkpoint: string | null): Promise<RawPayload[]> {
  const auth = { authorization: `Bearer ${token}` };
  const list = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=" +
      encodeURIComponent("is:important is:unread newer_than:14d"),
    { headers: auth },
  );
  if (!list.ok) return [];
  const ids = ((await list.json()) as { messages?: { id: string }[] }).messages ?? [];
  const out: RawPayload[] = [];
  for (const { id } of ids.slice(0, 10)) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: auth },
    );
    if (!res.ok) continue;
    const msg = (await res.json()) as GmailMessage;
    const at = msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : new Date().toISOString();
    if (checkpoint && at <= checkpoint) continue; // idempotent across syncs
    const headers = msg.payload?.headers ?? [];
    const header = (name: string) => headers.find((h) => h.name === name)?.value;
    out.push({
      type: "message.important",
      externalId: id,
      at,
      fields: { label: header("Subject") ?? "(no subject)", from: header("From") ?? "" },
    });
  }
  return out;
}

interface GmailMessage {
  internalDate?: string;
  payload?: { headers?: { name?: string; value?: string }[] };
}

/** Google Drive: recently-modified files newer than the checkpoint → document-updated payloads. */
async function fetchGoogleDrive(token: string, checkpoint: string | null): Promise<RawPayload[]> {
  const params = new URLSearchParams({
    orderBy: "modifiedTime desc",
    pageSize: "15",
    fields: "files(id,name,modifiedTime)",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const files = ((await res.json()) as { files?: DriveFile[] }).files ?? [];
  return files.flatMap((f) => {
    if (!f.id || !f.modifiedTime) return [];
    if (checkpoint && f.modifiedTime <= checkpoint) return []; // idempotent across syncs
    return [
      {
        type: "file.updated",
        externalId: f.id,
        at: f.modifiedTime,
        fields: { label: f.name ?? "(untitled file)" },
      } satisfies RawPayload,
    ];
  });
}

interface DriveFile {
  id?: string;
  name?: string;
  modifiedTime?: string;
}

const FETCHERS: Record<
  string,
  (token: string, checkpoint: string | null) => Promise<RawPayload[]>
> = {
  "google-calendar": fetchGoogleCalendar,
  github: fetchGitHub,
  gmail: fetchGmail,
  "google-drive": fetchGoogleDrive,
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
