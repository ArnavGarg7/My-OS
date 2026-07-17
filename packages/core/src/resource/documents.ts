import { DOCUMENT_EXPIRY_SOON_DAYS } from "./constants";
import { daysBetween, parseDate } from "./dates";
import type { ImportantDocument, RenewalItem } from "./types";

/**
 * Document engine (Sprint 4.3). A metadata catalogue of the papers you must never lose:
 * what it is, its number, who issued it, where it lives and when it dies. There are no file
 * bytes and no encrypted vault here — storing scans of a passport is a materially different
 * security problem, and this platform deliberately does not pretend to solve it.
 */

export function hasExpiry(doc: ImportantDocument): boolean {
  return doc.expiresAt !== null;
}

export function isDocumentExpired(doc: ImportantDocument, now: Date): boolean {
  if (!doc.expiresAt) return false;
  return daysBetween(now, parseDate(doc.expiresAt)) < 0;
}

export function daysUntilExpiry(doc: ImportantDocument, now: Date): number | null {
  if (!doc.expiresAt) return null;
  return daysBetween(now, parseDate(doc.expiresAt));
}

export function documentRenewalItem(doc: ImportantDocument, now: Date): RenewalItem | null {
  if (!doc.expiresAt) return null;
  const days = daysBetween(now, parseDate(doc.expiresAt));
  return {
    id: doc.id,
    name: doc.name,
    source: "document",
    expiresAt: doc.expiresAt,
    daysUntil: days,
    expired: days < 0,
  };
}

/** Documents expiring inside the window (or already lapsed), soonest first. */
export function expiringDocuments(
  documents: ImportantDocument[],
  now: Date,
  days = DOCUMENT_EXPIRY_SOON_DAYS,
): RenewalItem[] {
  return documents
    .map((d) => documentRenewalItem(d, now))
    .filter((r): r is RenewalItem => r !== null && r.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function documentsByType(documents: ImportantDocument[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of documents) out[d.type] = (out[d.type] ?? 0) + 1;
  return out;
}

/**
 * Document health 0–100: the share of expiry-bearing documents that are still valid.
 * A catalogue with no expiring documents is trivially healthy (100).
 */
export function documentHealth(documents: ImportantDocument[], now: Date): number {
  const dated = documents.filter(hasExpiry);
  if (dated.length === 0) return 100;
  const valid = dated.filter((d) => !isDocumentExpired(d, now)).length;
  return Math.round((valid / dated.length) * 100);
}
