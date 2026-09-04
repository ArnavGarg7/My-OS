import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { evaluateForOwner } from "@/server/proactive/service";

/**
 * Internal proactive-evaluation endpoint (Stage 6, always-on). The worker's pg-boss cron
 * POSTs here on a schedule so the OS evaluates meaningful state WITHOUT the user opening a
 * page. Guarded by a shared secret: when `MYOS_INTERNAL_SECRET` is unset the endpoint is
 * disabled (503) — honest about the fact that always-on requires that secret configured.
 * This is the only non-tRPC write path, and it triggers the same deterministic evaluation
 * the in-app `proactive.evaluate` uses (no new logic, no data fabricated).
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
    const result = await evaluateForOwner(getDb().db);
    return Response.json({ status: "ok", ...result, ts: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { status: "error", message: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
