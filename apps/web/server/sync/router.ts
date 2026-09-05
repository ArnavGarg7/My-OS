import "server-only";
import { z } from "zod";
import { OFFLINE_OPS } from "@myos/core/sync";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Sync router (Stage 8). The single endpoint the offline outbox replays through. Idempotent
 * by `clientMutationId`; only whitelisted personal ops are accepted (the input enum is the
 * gate). `tz` comes from the identity on the context. Auth is enforced as for any mutation —
 * offline replay does not bypass authentication.
 */
export const syncRouter = router({
  // Named `run` (not `apply`) — tRPC reserves Function.prototype method names on the router proxy.
  run: protectedProcedure
    .input(
      z.object({
        clientMutationId: z.string().min(1).max(200),
        op: z.enum(OFFLINE_OPS),
        payload: z.record(z.unknown()),
      }),
    )
    .mutation(({ ctx, input }) => service.apply(ctx.db, ctx.identity.preferences.timezone, input)),
});
