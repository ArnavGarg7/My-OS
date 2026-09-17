import "server-only";
import type { Database } from "@myos/db";
import type { CalendarEvent } from "@myos/core/calendar";
import { sampleEvent, type ProviderAdapter } from "./ics";
import * as connectorRepo from "../../connectors/repository";
import { decryptSecret } from "../../connectors/vault";
import { refreshTokens, type TokenBundle } from "../../connectors/oauth";

async function getLiveToken(db: Database): Promise<string | null> {
  const accounts = await connectorRepo.listAccounts(db).catch(() => []);
  const acc = accounts.find((a) => a.providerId === "google-calendar");
  if (!acc) return null;
  const cred = await connectorRepo.loadCredential(db, acc.id).catch(() => null);
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
    const refreshed = await refreshTokens("google-calendar", bundle.refreshToken).catch(() => null);
    if (refreshed?.accessToken) {
      bundle = refreshed;
      await connectorRepo.updateCredential(db, acc.id, cred.sealed, "•••live").catch(() => {});
    }
  }
  return bundle.accessToken || null;
}

interface GoogleApiEvent {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  created?: string;
  updated?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
}

/**
 * Google Calendar adapter (Sprint 2.7). If a live Google connector is configured and authorized,
 * fetches real events from the primary calendar. Otherwise falls back to deterministic sample events.
 */
export const googleProvider: ProviderAdapter = {
  name: "google",
  async fetch(db?: Database): Promise<CalendarEvent[]> {
    if (db) {
      const token = await getLiveToken(db).catch(() => null);
      if (token) {
        const timeMin = new Date(Date.now() - 30 * 86_400_000).toISOString();
        const timeMax = new Date(Date.now() + 180 * 86_400_000).toISOString();
        const params = new URLSearchParams({
          singleEvents: "true",
          orderBy: "startTime",
          timeMin,
          timeMax,
          maxResults: "250",
        });

        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
          { headers: { authorization: `Bearer ${token}` } },
        ).catch(() => null);

        if (res && res.ok) {
          const data = (await res.json().catch(() => null)) as { items?: GoogleApiEvent[] } | null;
          if (data?.items && data.items.length > 0) {
            const now = new Date().toISOString();
            return data.items
              .filter((e) => e.status !== "cancelled" && (e.start?.dateTime || e.start?.date))
              .map((e) => {
                const startAt = e.start?.dateTime ?? `${e.start?.date}T00:00:00.000Z`;
                const endAt = e.end?.dateTime ?? `${e.end?.date}T23:59:59.000Z`;
                return {
                  id: "",
                  title: e.summary || "(untitled event)",
                  description: e.description || "",
                  calendarId: "",
                  location: e.location || "",
                  startAt,
                  endAt,
                  timezone: e.start?.timeZone || "UTC",
                  allDay: Boolean(e.start?.date),
                  status: "confirmed" as const,
                  source: "google" as const,
                  recurrenceRule: null,
                  recurrenceParent: null,
                  createdAt: e.created || now,
                  updatedAt: e.updated || now,
                };
              });
          }
        }
      }
    }

    return [
      sampleEvent("google", "Team Standup", 9, 9.5),
      sampleEvent("google", "Product Sync", 14, 15),
    ];
  },
};
