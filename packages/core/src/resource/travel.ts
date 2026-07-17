import { RENEWAL_SOON_DAYS } from "./constants";
import { daysBetween, parseDate } from "./dates";
import type { RenewalItem, TravelDocument } from "./types";

/**
 * Travel & identity engine (Sprint 4.3). Passports, visas, travel insurance, vaccination
 * records, lounge and frequent-flyer memberships — everything with an expiry that strands
 * you at a border. Metadata only, same as the document catalogue.
 */

export function isTravelDocumentExpired(doc: TravelDocument, now: Date): boolean {
  if (!doc.expiresAt) return false;
  return daysBetween(now, parseDate(doc.expiresAt)) < 0;
}

export function travelRenewalItem(doc: TravelDocument, now: Date): RenewalItem | null {
  if (!doc.expiresAt) return null;
  const days = daysBetween(now, parseDate(doc.expiresAt));
  return {
    id: doc.id,
    name: doc.name,
    source: "travel",
    expiresAt: doc.expiresAt,
    daysUntil: days,
    expired: days < 0,
  };
}

/** Travel documents expiring inside the window (or lapsed), soonest first. */
export function expiringTravelDocuments(
  documents: TravelDocument[],
  now: Date,
  days = RENEWAL_SOON_DAYS,
): RenewalItem[] {
  return documents
    .map((d) => travelRenewalItem(d, now))
    .filter((r): r is RenewalItem => r !== null && r.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function passports(documents: TravelDocument[]): TravelDocument[] {
  return documents.filter((d) => d.type === "passport");
}

export function activeVisas(documents: TravelDocument[], now: Date): TravelDocument[] {
  return documents.filter((d) => d.type === "visa" && !isTravelDocumentExpired(d, now));
}

/** Countries you hold any live travel document for — the travel-history footprint. */
export function countries(documents: TravelDocument[]): string[] {
  return [...new Set(documents.map((d) => d.country).filter((c) => c.length > 0))].sort();
}

export function travelByType(documents: TravelDocument[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of documents) out[d.type] = (out[d.type] ?? 0) + 1;
  return out;
}
