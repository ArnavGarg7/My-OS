import "server-only";
import { and, desc, eq } from "drizzle-orm";
import {
  aiEvalRuns,
  aiExecutionTraces,
  aiPerformanceMetrics,
  aiProviderBenchmarks,
  aiProviderHealth,
  aiPromptVersions,
  aiReliabilityEvents,
  aiSecurityEvents,
} from "@myos/db/schema";
import type { Database } from "@myos/db";
import type { ExecutionTrace } from "@myos/ai/observability";

/**
 * AI platform repository (Sprint 5.1). Persists the platform's infrastructure state — provider
 * health probes, eval run summaries, and the prompt-version registry. No business data.
 */

/** Record the latest health probe for each provider (append-only history). */
export async function recordProviderHealth(
  db: Database,
  rows: { provider: string; state: string; detail: string; checkedAt: string }[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(aiProviderHealth).values(
    rows.map((r) => ({
      provider: r.provider,
      state: r.state,
      detail: r.detail,
      checkedAt: new Date(r.checkedAt),
    })),
  );
}

/** Persist an evaluation run summary for regression tracking. */
export async function recordEvalRun(
  db: Database,
  run: {
    suite: string;
    total: number;
    passed: number;
    failed: number;
    cases: { name: string; pass: boolean; detail: string }[];
  },
): Promise<void> {
  await db.insert(aiEvalRuns).values(run);
}

/** Seed the prompt-version registry from the in-memory registry (idempotent-ish insert). */
export async function seedPromptVersions(
  db: Database,
  prompts: {
    name: string;
    version: string;
    owner: string;
    compatibleModels: string[];
    outputSchema?: string | undefined;
  }[],
): Promise<number> {
  if (prompts.length === 0) return 0;
  const inserted = await db
    .insert(aiPromptVersions)
    .values(
      prompts.map((p) => ({
        name: p.name,
        version: p.version,
        owner: p.owner,
        template: "",
        compatibleModels: p.compatibleModels,
        outputSchema: p.outputSchema ?? null,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: aiPromptVersions.id });
  return inserted.length;
}

/**
 * Set one prompt version active and every other version of that prompt rolled_back (Sprint 5.4
 * rollback — one active version at a time). No-op if the target row doesn't exist.
 */
export async function setActivePromptVersion(
  db: Database,
  name: string,
  version: string,
): Promise<void> {
  await db
    .update(aiPromptVersions)
    .set({ status: "rolled_back" })
    .where(eq(aiPromptVersions.name, name));
  await db
    .update(aiPromptVersions)
    .set({ status: "active" })
    .where(and(eq(aiPromptVersions.name, name), eq(aiPromptVersions.version, version)));
}

/** Persist a complete execution trace (Sprint 5.4 observability). */
export async function recordTrace(db: Database, t: ExecutionTrace): Promise<void> {
  await db.insert(aiExecutionTraces).values({
    traceId: t.traceId,
    conversationId: t.conversationId,
    feature: t.feature,
    provider: t.provider,
    promptVersion: t.promptVersion,
    contextBuilders: t.contextBuilders,
    toolCalls: t.toolCalls,
    memoryRetrieved: t.memoryRetrieved,
    latencies: t.latencies as unknown as Record<string, number>,
    inputTokens: t.inputTokens,
    outputTokens: t.outputTokens,
    fallbacks: t.fallbacks,
    grounded: t.grounded,
    status: t.status,
  });
}

/** Recent execution traces (newest first). */
export async function listTraces(db: Database, limit = 20) {
  return db
    .select()
    .from(aiExecutionTraces)
    .orderBy(desc(aiExecutionTraces.createdAt))
    .limit(limit);
}

/** Persist benchmark rows for a scenario run. */
export async function recordBenchmarks(
  db: Database,
  rows: {
    scenarioId: string;
    provider: string;
    quality: number;
    toolAccuracy: number;
    latencyMs: number;
    tokens: number;
    costUsd: number;
    recommended: boolean;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(aiProviderBenchmarks).values(rows);
}

/** Persist performance samples. */
export async function recordPerformance(
  db: Database,
  rows: { stage: string; feature: string; ms: number; breached: boolean }[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(aiPerformanceMetrics).values(rows);
}

/** Persist a reliability event. */
export async function recordReliabilityEvent(
  db: Database,
  row: {
    kind: string;
    recovered: boolean;
    finalProvider: string;
    attempts: number;
    actionsTaken: string[];
  },
): Promise<void> {
  await db.insert(aiReliabilityEvents).values(row);
}

/** Persist a security event (never secret values). */
export async function recordSecurityEvent(
  db: Database,
  row: { kind: string; severity: string; detail: string; metadata?: Record<string, unknown> },
): Promise<void> {
  await db.insert(aiSecurityEvents).values({
    kind: row.kind,
    severity: row.severity,
    detail: row.detail,
    metadata: row.metadata ?? {},
  });
}

/** Recent security events. */
export async function listSecurityEvents(db: Database, limit = 20) {
  return db.select().from(aiSecurityEvents).orderBy(desc(aiSecurityEvents.createdAt)).limit(limit);
}
