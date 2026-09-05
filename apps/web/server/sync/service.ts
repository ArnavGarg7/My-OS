import "server-only";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Database } from "@myos/db";
import { syncMutations } from "@myos/db/schema";
import { isOfflineOp, type OfflineOp } from "@myos/core/sync";
import * as taskService from "../task/service";
import * as inboxService from "../inbox/service";
import * as journalService from "../journal/service";
import * as focusService from "../focus/service";

/**
 * Offline sync service (Stage 8). Applies a replayed offline mutation exactly once. The
 * `client_mutation_id` is the idempotency key: a replay returns the stored result instead
 * of re-executing, so the outbox can retry freely without ever duplicating server state.
 * Dispatches to the EXISTING per-domain services — no second task/inbox/focus/journal model.
 * Only whitelisted PERSONAL ops are accepted (shared/external ops are network-required and
 * never reach here). Secrets are never stored (Stage 4 credentials stay server-side).
 */

/** Cast a stored payload to the target service's input type (validated client-side before enqueue). */
async function dispatch(
  db: Database,
  tz: string,
  op: OfflineOp,
  payload: Record<string, unknown>,
): Promise<unknown> {
  switch (op) {
    case "task.create":
      return taskService.create(db, payload as Parameters<typeof taskService.create>[1]);
    case "task.update":
      return taskService.update(db, payload as Parameters<typeof taskService.update>[1]);
    case "task.complete":
      return taskService.complete(db, String(payload.id));
    case "inbox.capture":
      return inboxService.capture(db, payload as Parameters<typeof inboxService.capture>[1]);
    case "journal.create":
      return journalService.create(db, payload as Parameters<typeof journalService.create>[1]);
    case "focus.pause":
      return focusService.pause(db, tz, String(payload.id));
    case "focus.resume":
      return focusService.resume(db, tz, String(payload.id));
    case "focus.complete":
      return focusService.complete(
        db,
        tz,
        String(payload.id),
        typeof payload.energyAfter === "number" ? payload.energyAfter : null,
        typeof payload.notes === "string" ? payload.notes : undefined,
      );
    default:
      throw new TRPCError({ code: "BAD_REQUEST", message: `Unsupported offline op: ${op}` });
  }
}

export interface ApplyInput {
  clientMutationId: string;
  op: string;
  payload: Record<string, unknown>;
}

export async function apply(
  db: Database,
  tz: string,
  input: ApplyInput,
): Promise<{ deduped: boolean; result: unknown }> {
  // Idempotency: already applied → return the stored result, do NOT re-execute.
  const [existing] = await db
    .select()
    .from(syncMutations)
    .where(eq(syncMutations.clientMutationId, input.clientMutationId))
    .limit(1);
  if (existing) return { deduped: true, result: existing.result };

  if (!isOfflineOp(input.op)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `"${input.op}" is not an offline-safe operation and requires a connection.`,
    });
  }

  const result = await dispatch(db, tz, input.op, input.payload);
  await db
    .insert(syncMutations)
    .values({
      clientMutationId: input.clientMutationId,
      op: input.op,
      status: "succeeded",
      result: result as never,
    })
    .onConflictDoNothing();
  return { deduped: false, result };
}
