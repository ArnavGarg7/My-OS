import "server-only";
import { EventEmitter } from "node:events";

/**
 * Collaboration realtime seam (Stage 7). A tiny in-process pub/sub the SSE endpoint
 * subscribes to, so a change in one session/tab propagates live to others without polling.
 *
 * HONEST SCOPE: this propagates within a single server process — enough for the owner's
 * own tabs and the clean seam multiplayer needs, and it is verifiable. TRUE two-user
 * realtime additionally needs (a) a second authenticated user (not possible in this
 * single-owner deployment) and (b) a cross-process broker when running multiple web
 * instances. Both are deliberately out of scope; the domain events + subscription API are
 * the seam a future Redis/pg-LISTEN fan-out or a second client plugs into unchanged.
 */
export interface CollabEvent {
  kind:
    | "message.posted"
    | "message.updated"
    | "task.assigned"
    | "member.added"
    | "member.removed"
    | "decision.resolved"
    | "activity";
  subjectType?: string;
  subjectId?: string;
  projectId?: string | null;
  at: string;
}

const g = globalThis as unknown as { __collabEmitter?: EventEmitter };
function emitter(): EventEmitter {
  if (!g.__collabEmitter) {
    g.__collabEmitter = new EventEmitter();
    g.__collabEmitter.setMaxListeners(200);
  }
  return g.__collabEmitter;
}

export function emitCollab(event: CollabEvent): void {
  emitter().emit("collab", event);
}

/** Subscribe; returns an unsubscribe function. */
export function onCollab(listener: (event: CollabEvent) => void): () => void {
  emitter().on("collab", listener);
  return () => emitter().off("collab", listener);
}
