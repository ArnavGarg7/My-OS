import PgBoss from "pg-boss";
import { loadRootEnv, parseServerEnv } from "@myos/shared/env";
import { createDb } from "@myos/db";
import { logger } from "./logger";

loadRootEnv();

/**
 * My OS worker (04_System_Architecture.md §2 / §11).
 *
 * Owns pg-boss: cron schedules, queue consumers, the notification dispatcher,
 * the automation engine, AI background jobs and backups. All of those land from
 * Sprint 1.2 onward — Sprint 1.1 boots the process, verifies the DB connection,
 * starts pg-boss (which provisions its own `pgboss` schema — not an application
 * table) and emits a heartbeat. Safe to restart at any time (jobs are durable).
 */
const HEARTBEAT_MS = 60_000;

async function main(): Promise<void> {
  const env = parseServerEnv();
  logger.info("worker starting…");

  // 1. Verify database connectivity before doing anything else.
  const dbHandle = createDb(env.DATABASE_URL, { max: 5 });
  await dbHandle.sql`SELECT 1`;
  logger.info("database connection ok");

  // 2. Start pg-boss (durable Postgres-backed queue/scheduler).
  const boss = new PgBoss({ connectionString: env.DATABASE_URL });
  boss.on("error", (error) => logger.error({ err: error }, "pg-boss error"));
  await boss.start();
  logger.info("pg-boss started (queue schema ready)");

  // 3. Heartbeat (Sprint 1.1: log only; DB heartbeat row lands with its table).
  const heartbeat = setInterval(() => {
    logger.info({ ts: new Date().toISOString() }, "worker heartbeat");
  }, HEARTBEAT_MS);

  logger.info("worker ready");

  // 4. Graceful shutdown.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "worker shutting down…");
    clearInterval(heartbeat);
    await boss.stop({ graceful: true });
    await dbHandle.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "worker fatal error on boot");
  process.exit(1);
});
