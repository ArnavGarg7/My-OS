import { getCurrentUser } from "@/server/identity";
import { onCollab, type CollabEvent } from "@/server/collaboration/realtime";

/**
 * Collaboration realtime stream (Stage 7). A Server-Sent Events endpoint the client
 * subscribes to so shared-context changes (new messages, assignments, activity) propagate
 * live without polling. Auth-gated (owner session). This is the clean realtime SEAM:
 * within one server process it fans out to the owner's tabs; a future cross-process broker
 * or second authenticated client plugs into `onCollab` unchanged. See realtime.ts for the
 * honest scope of what is (and isn't) verifiable in a single-owner deployment.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: CollabEvent) => {
        try {
          controller.enqueue(encoder.encode(`event: collab\ndata: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* stream closed */
        }
      };
      controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));
      unsubscribe = onCollab(send);
      // Keep the connection alive through proxies.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 25_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
