import { router, publicProcedure } from "../trpc";
import { meRouter } from "./me";
import { pushRouter } from "./push";

/**
 * Root tRPC router (04 §5). Feature routers (tasks, planner, health, …) mount
 * here. Sprint 1.5 adds `me` (identity + personalization).
 */
export const appRouter = router({
  me: meRouter,
  push: pushRouter,
  system: router({
    health: publicProcedure.query(async ({ ctx }) => {
      let db = false;
      try {
        await ctx.sql`SELECT 1`;
        db = true;
      } catch {
        db = false;
      }
      return {
        ok: true,
        db,
        service: "myos-web",
        ts: new Date().toISOString(),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
