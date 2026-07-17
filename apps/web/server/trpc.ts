import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { logOperation, newRequestId, toLogError } from "@/lib/observability/logger";

const t = initTRPC.context<Context>().create();

export const router = t.router;

/**
 * Observability middleware (Phase 4.5). Wraps EVERY procedure: assigns a request id, resolves
 * the acting identity (memoised per request, so protected procedures pay nothing extra), times
 * the call and emits one structured line via `logOperation` with module/operation/duration/
 * status. The tRPC `path` ("task.list") is split into module + operation. No feature logic —
 * pure instrumentation, so it can wrap public and protected procedures alike.
 */
const observed = t.procedure.use(async ({ ctx, path, next }) => {
  const requestId = newRequestId();
  const [module, operation = "index"] = path.split(".");
  const startedAt = Date.now();
  const identity = await ctx.getIdentity().catch(() => null);
  const userId = identity?.id;
  const result = await next();
  logOperation({
    requestId,
    ...(userId !== undefined ? { userId } : {}),
    module: module ?? "unknown",
    operation,
    durationMs: Date.now() - startedAt,
    status: result.ok ? "ok" : "error",
    ...(result.ok ? {} : { error: toLogError(result.error) }),
  });
  return result;
});

export const publicProcedure = observed;

/**
 * Protected procedure (04 §5 / §9). Requires an authenticated identity; injects
 * the non-null `identity` into `ctx`. Auth is resolved through the
 * IdentityService, so this never references Clerk. Built on the observed procedure,
 * so every protected call is logged too.
 */
export const protectedProcedure = observed.use(async ({ ctx, next }) => {
  const identity = await ctx.getIdentity();
  if (!identity) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }
  return next({ ctx: { identity } });
});
