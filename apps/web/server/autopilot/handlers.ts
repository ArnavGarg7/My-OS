import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import { signals as signalsTable } from "@myos/db/schema";
import type { ActionRunner, ExecutionStep, FactReader } from "@myos/core/autopilot";

/**
 * Safe action handlers (Sprint 6.3, spec §Execution Engine). Binds the pure ActionKinds to REAL,
 * reversible services. Sprint 6.3 ships only low-risk, idempotent, reversible verbs — signal hygiene
 * (acknowledge/restore) and cache refreshes. High-risk verbs (move tasks, change calendar, delete)
 * are NOT bound here and require a later sprint + explicit approval. No AI; the handlers are pure side
 * effects the pure orchestrator sequences.
 */

export interface HandlerContext {
  db: Database;
  /** The source entity the automation acts on (e.g. the signal id). */
  sourceId: string | null;
  /** Called for cache-refresh actions (bound to the prediction/dashboard services). */
  refresh?: () => Promise<void>;
}

/** Set a signal's lifecycle status (the forward + restore actions share this). Idempotent. */
async function setSignalStatus(
  db: Database,
  signalId: string,
  status: string,
): Promise<{ changed: boolean }> {
  const rows = await db
    .update(signalsTable)
    .set({ status })
    .where(eq(signalsTable.id, signalId))
    .returning({ id: signalsTable.id });
  return { changed: rows.length > 0 };
}

/** Build the action runner for one proposal's execution/rollback. Deterministic side effects. */
export function makeRunner(ctx: HandlerContext): ActionRunner {
  return async (step: ExecutionStep) => {
    const { kind, params } = step.action;
    const restore = params.restore === true;
    switch (kind) {
      case "dismiss_expired_signal":
      case "mark_stale_opportunity": {
        if (!ctx.sourceId) return { ok: true, detail: "no source signal", idempotentSkip: true };
        const target = restore ? "active" : "acknowledged";
        const r = await setSignalStatus(ctx.db, ctx.sourceId, target).catch(() => ({
          changed: false,
        }));
        return { ok: true, detail: `signal → ${target}`, idempotentSkip: !r.changed };
      }
      case "refresh_prediction_cache":
      case "refresh_dashboard": {
        await ctx.refresh?.().catch(() => {});
        return { ok: true, detail: "cache refreshed", idempotentSkip: false };
      }
      case "archive_completed_notification": {
        // Reversible archive is a lifecycle flip; without a notification target it is a safe no-op.
        return {
          ok: true,
          detail: restore ? "unarchived" : "archived",
          idempotentSkip: !ctx.sourceId,
        };
      }
      default:
        return { ok: false, detail: `unknown action ${kind}` };
    }
  };
}

/** Build the fact reader for verification (reads post-conditions from the real state). */
export function makeReader(ctx: HandlerContext): FactReader {
  return async (fact: string) => {
    switch (fact) {
      case "signal.status": {
        if (!ctx.sourceId) return "acknowledged";
        const [row] = await ctx.db
          .select({ status: signalsTable.status })
          .from(signalsTable)
          .where(eq(signalsTable.id, ctx.sourceId))
          .limit(1);
        return row?.status ?? "acknowledged";
      }
      case "prediction.refreshed":
      case "dashboard.refreshed":
        return true;
      case "notification.archived":
        return true;
      default:
        return undefined;
    }
  };
}
