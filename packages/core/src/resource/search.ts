import type {
  Asset,
  ImportantDocument,
  InsurancePolicy,
  InvestmentPosition,
  Relationship,
  TravelDocument,
  Vehicle,
} from "./types";

/**
 * Resource search (Sprint 4.3). Keyword matching with fixed weight bands — the same
 * deterministic approach Knowledge (4.1) uses. No vectors, no embeddings, no ranking model:
 * a name match outranks a field match, ties break alphabetically, and the same query always
 * returns the same rows in the same order. Phase 5 may layer semantics *on top* of this
 * seam; it does not replace it.
 */

export const SEARCH_WEIGHTS = {
  /** Query equals the entity's name. */
  exactName: 100,
  /** Name starts with the query. */
  namePrefix: 60,
  /** Name contains the query. */
  nameContains: 40,
  /** An identifying field (symbol, serial, number, reference) contains the query. */
  identifier: 30,
  /** Any other searchable field contains the query. */
  field: 10,
} as const;

export type ResourceEntityKind =
  "asset" | "investment" | "relationship" | "document" | "insurance" | "vehicle" | "travel";

export interface SearchHit {
  id: string;
  kind: ResourceEntityKind;
  title: string;
  subtitle: string;
  score: number;
}

function scoreName(name: string, q: string): number {
  const n = name.toLowerCase();
  if (n === q) return SEARCH_WEIGHTS.exactName;
  if (n.startsWith(q)) return SEARCH_WEIGHTS.namePrefix;
  if (n.includes(q)) return SEARCH_WEIGHTS.nameContains;
  return 0;
}

function scoreFields(fields: string[], q: string, weight: number): number {
  return fields.some((f) => f.toLowerCase().includes(q)) ? weight : 0;
}

export interface SearchInput {
  assets: Asset[];
  positions: InvestmentPosition[];
  relationships: Relationship[];
  documents: ImportantDocument[];
  policies: InsurancePolicy[];
  vehicles: Vehicle[];
  travel: TravelDocument[];
}

/**
 * Search every resource entity. An empty query returns nothing rather than everything —
 * a blank search box should not dump the user's entire net worth onto the screen.
 */
export function searchResources(input: SearchInput, query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  const push = (
    id: string,
    kind: ResourceEntityKind,
    title: string,
    subtitle: string,
    score: number,
  ) => {
    if (score > 0) hits.push({ id, kind, title, subtitle, score });
  };

  for (const a of input.assets) {
    push(
      a.id,
      "asset",
      a.name,
      a.type,
      scoreName(a.name, q) +
        scoreFields([a.serialNumber], q, SEARCH_WEIGHTS.identifier) +
        scoreFields([a.location, a.notes], q, SEARCH_WEIGHTS.field),
    );
  }
  for (const p of input.positions) {
    push(
      p.id,
      "investment",
      p.name,
      p.symbol,
      scoreName(p.name, q) + scoreFields([p.symbol], q, SEARCH_WEIGHTS.identifier),
    );
  }
  for (const r of input.relationships) {
    if (r.archived) continue;
    push(
      r.id,
      "relationship",
      r.name,
      [r.role, r.company].filter(Boolean).join(" · "),
      scoreName(r.name, q) +
        scoreFields(
          [r.company, r.role, r.location, ...r.interests, r.notes],
          q,
          SEARCH_WEIGHTS.field,
        ),
    );
  }
  for (const d of input.documents) {
    push(
      d.id,
      "document",
      d.name,
      d.type,
      scoreName(d.name, q) +
        scoreFields([d.documentNumber], q, SEARCH_WEIGHTS.identifier) +
        scoreFields([d.issuer, d.location], q, SEARCH_WEIGHTS.field),
    );
  }
  for (const p of input.policies) {
    push(
      p.id,
      "insurance",
      p.name,
      p.provider,
      scoreName(p.name, q) +
        scoreFields([p.policyNumber], q, SEARCH_WEIGHTS.identifier) +
        scoreFields([p.provider], q, SEARCH_WEIGHTS.field),
    );
  }
  for (const v of input.vehicles) {
    push(
      v.id,
      "vehicle",
      v.name,
      v.registrationNumber,
      scoreName(v.name, q) + scoreFields([v.registrationNumber], q, SEARCH_WEIGHTS.identifier),
    );
  }
  for (const t of input.travel) {
    push(
      t.id,
      "travel",
      t.name,
      t.country,
      scoreName(t.name, q) +
        scoreFields([t.reference], q, SEARCH_WEIGHTS.identifier) +
        scoreFields([t.country], q, SEARCH_WEIGHTS.field),
    );
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
