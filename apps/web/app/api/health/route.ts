import { getDb } from "@/server/db";

/**
 * Liveness/health probe (04 §11). Checks DB reachability; Caddy + an external
 * uptime pinger poll this. Worker/boss/disk checks are added with their subsystems.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const { sql } = getDb();
  try {
    await sql`SELECT 1`;
    return Response.json({
      status: "ok",
      db: "up",
      service: "myos-web",
      ts: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: "degraded", db: "down", service: "myos-web", ts: new Date().toISOString() },
      { status: 503 },
    );
  }
}
