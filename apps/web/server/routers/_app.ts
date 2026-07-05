import { router, publicProcedure } from "../trpc";

/**
 * Root tRPC router (04 §5). Feature routers (tasks, planner, health, …) are
 * mounted here from Sprint 1.2 onward. Sprint 1.1 exposes a health probe only.
 */
export const appRouter = router({
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
