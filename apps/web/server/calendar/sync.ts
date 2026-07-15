import "server-only";
import type { CalendarEvent, CalendarProvider, SyncResult } from "@myos/core/calendar";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { eventRowToEvent } from "./mapper";
import { googleProvider } from "./providers/google";
import { outlookProvider } from "./providers/outlook";
import { appleProvider } from "./providers/apple";
import { icsProvider, type ProviderAdapter } from "./providers/ics";

/**
 * Calendar sync engine (Sprint 2.7). Provider-agnostic pipeline:
 * fetch → normalize → diff → merge → persist → log. Provider-specific logic
 * lives only in the adapters.
 */
const PROVIDERS: Record<Exclude<CalendarProvider, "local">, ProviderAdapter> = {
  google: googleProvider,
  outlook: outlookProvider,
  apple: appleProvider,
  ics: icsProvider,
};

/** A stable-ish identity for diffing without a provider UID column. */
function fingerprint(e: { source: string; title: string; startAt: string }): string {
  return `${e.source}::${e.title}::${e.startAt}`;
}

export async function runSync(db: Database, provider: CalendarProvider): Promise<SyncResult> {
  if (provider === "local") {
    return { provider, status: "success", imported: 0, updated: 0, deleted: 0 };
  }
  const adapter = PROVIDERS[provider];
  const calendarId = await repo.ensurePrimary(db);

  try {
    const fetched = await adapter.fetch();
    const existing = (await repo.listEvents(db, {})).map(eventRowToEvent);
    const byFingerprint = new Map(existing.map((e) => [fingerprint(e), e]));

    let imported = 0;
    let updated = 0;
    for (const raw of fetched) {
      const event: CalendarEvent = { ...raw, calendarId };
      const match = byFingerprint.get(fingerprint(event));
      if (match) {
        await repo.updateEvent(db, match.id, { ...event, id: match.id });
        updated += 1;
      } else {
        await repo.insertEvent(db, event);
        imported += 1;
      }
    }

    await repo.markSynced(db, calendarId);
    await repo.logSync(db, { provider, status: "success", imported, updated, deleted: 0 });
    return { provider, status: "success", imported, updated, deleted: 0 };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Sync failed";
    await repo.logSync(db, {
      provider,
      status: "error",
      imported: 0,
      updated: 0,
      deleted: 0,
      error,
    });
    return { provider, status: "error", imported: 0, updated: 0, deleted: 0, error };
  }
}

export const AVAILABLE_PROVIDERS = Object.keys(PROVIDERS) as CalendarProvider[];
