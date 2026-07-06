import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure (04 §5 / §9). Requires an authenticated identity; injects
 * the non-null `identity` into `ctx`. Auth is resolved through the
 * IdentityService, so this never references Clerk.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const identity = await ctx.getIdentity();
  if (!identity) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }
  return next({ ctx: { identity } });
});
