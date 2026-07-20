import { router, publicProcedure } from "../trpc";
import { meRouter } from "./me";
import { pushRouter } from "./push";
import { todayRouter } from "../today/router";
import { inboxRouter } from "../inbox/router";
import { taskRouter } from "../task/router";
import { plannerRouter } from "../planner/router";
import { calendarRouter } from "../calendar/router";
import { projectRouter } from "../project/router";
import { journalRouter } from "../journal/router";
import { healthRouter } from "../health/router";
import { financeRouter } from "../finance/router";
import { goalRouter } from "../goal/router";
import { timelineRouter } from "../timeline/router";
import { analyticsRouter } from "../analytics/router";
import { tomorrowRouter } from "../tomorrow/router";
import { focusRouter } from "../focus/router";
import { notificationRouter } from "../notification/router";
import { automationRouter } from "../automation/router";
import { orchestrationRouter } from "../orchestration/router";
import { knowledgeRouter } from "../knowledge/router";
import { lifeRouter } from "../life/router";
import { resourceRouter } from "../resource/router";
import { intelligenceRouter } from "../intelligence/router";
import { aiRouter } from "../ai/router";
import { chiefRouter } from "../chief/router";
import { assistantRouter } from "../assistant/router";

/**
 * Root tRPC router (04 §5). Feature routers (tasks, planner, health, …) mount
 * here. Sprint 1.5 adds `me` (identity + personalization).
 */
export const appRouter = router({
  me: meRouter,
  push: pushRouter,
  today: todayRouter,
  inbox: inboxRouter,
  task: taskRouter,
  planner: plannerRouter,
  calendar: calendarRouter,
  project: projectRouter,
  health: healthRouter,
  journal: journalRouter,
  finance: financeRouter,
  goal: goalRouter,
  timeline: timelineRouter,
  analytics: analyticsRouter,
  tomorrow: tomorrowRouter,
  focus: focusRouter,
  notification: notificationRouter,
  automation: automationRouter,
  orchestration: orchestrationRouter,
  knowledge: knowledgeRouter,
  life: lifeRouter,
  resource: resourceRouter,
  intelligence: intelligenceRouter,
  ai: aiRouter,
  chief: chiefRouter,
  assistant: assistantRouter,
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
