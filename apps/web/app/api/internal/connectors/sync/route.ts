import { authUsers } from "@myos/db/schema";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { syncAllConnected } from "@/server/connectors/service";
import * as identityRepo from "@/server/identity/repository";

/**
 * Internal connector auto-sync endpoint (Stage B, background sync). The worker's pg-boss cron POSTs
 * here on a schedule so live connectors (Google Calendar/Gmail/Drive, GitHub) stay fresh without the
 * user clicking "Sync now". Guarded by the shared secret: disabled (503) when `MYOS_INTERNAL_SECRET`
 * is unset. Resolves the single owner's timezone (like the proactive tick) and runs the same sync
 * path as the UI — no new logic, sample-only accounts are skipped.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = getEnv().MYOS_INTERNAL_SECRET;
  if (!secret) {
    return Response.json(
      { status: "disabled", reason: "MYOS_INTERNAL_SECRET not configured" },
      { status: 503 },
    );
  }
  if (req.headers.get("x-internal-secret") !== secret) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }
  try {
    const { db } = getDb();
    const [owner] = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
    const tz = owner
      ? ((await identityRepo.getPreferences(db, owner.id).catch(() => null))?.timezone ?? "UTC")
      : "UTC";
    const result = await syncAllConnected(db, tz);
    return Response.json({ status: "ok", ...result, ts: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { status: "error", message: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
