import "server-only";
import type { Decision, DecisionType } from "@myos/core/decision";
import type { DecisionHistoryRow } from "@myos/db/schema";

/**
 * Decision row ↔ DTO mapping (Sprint 2.3). `type` + `inputsUsed` live in the
 * metadata jsonb (the migration added only the lifecycle columns).
 */
export function rowToDecision(row: DecisionHistoryRow): Decision {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const inputs = meta["inputsUsed"];
  return {
    id: row.id,
    ruleId: row.ruleId ?? "",
    type: (typeof meta["type"] === "string" ? meta["type"] : "system") as DecisionType,
    title: row.decision,
    reason: row.reason ?? "",
    confidence: row.confidence ?? 0,
    priority: row.priority,
    score: row.score,
    state: row.status,
    inputsUsed: Array.isArray(inputs) ? (inputs as string[]) : [],
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    deferredUntil: row.deferredUntil ? row.deferredUntil.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    metadata: meta,
  };
}

/** The mutable columns for a decision (used by insert + update). */
export function decisionToColumns(d: Decision) {
  return {
    decision: d.title,
    reason: d.reason,
    confidence: d.confidence,
    status: d.state,
    priority: d.priority,
    score: d.score,
    ruleId: d.ruleId,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    deferredUntil: d.deferredUntil ? new Date(d.deferredUntil) : null,
    completedAt: d.completedAt ? new Date(d.completedAt) : null,
    metadata: { ...d.metadata, type: d.type, inputsUsed: d.inputsUsed },
    accepted: d.state === "accepted",
    dismissed: d.state === "dismissed",
  };
}
