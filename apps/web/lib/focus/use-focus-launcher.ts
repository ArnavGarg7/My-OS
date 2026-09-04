"use client";

import { useRouter } from "next/navigation";
import type { SessionType } from "@myos/core/focus";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";

export interface StartFocusOptions {
  type?: SessionType;
  plannedMinutes?: number;
  projectId?: string | null;
  plannerBlockId?: string | null;
}

/**
 * The cross-module Focus launcher (Stage 2). A lightweight, mutation-only hook —
 * NO queries — so Tasks, Command Center, Today and Planner can start a
 * task-linked deep-work session and jump into Focus without each page mounting
 * the full focus workspace controller. This is the EXECUTE seam of the operating
 * workflow: PLAN → CAPTURE → ORGANIZE → EXECUTE → REVIEW.
 *
 * Starting on a task marks it in_progress server-side (see focus/service), so the
 * work is reflected back in Tasks. The backend abandons any already-active
 * session, so launching is always safe.
 */
export function useFocusLauncher() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();

  const start = trpc.focus.start.useMutation({
    onSuccess: () => {
      void utils.focus.active.invalidate();
      void utils.focus.summary.invalidate();
      void utils.task.list.invalidate();
      void utils.task.counts.invalidate();
      router.push("/focus");
    },
    onError: (e) => toaster.error("Couldn't start focus", e.message),
  });

  return {
    pending: start.isPending,
    /** Start a deep-work session anchored to a task, then open Focus. */
    startFocusOnTask: (taskId: string, opts: StartFocusOptions = {}) =>
      start.mutate({
        taskId,
        type: opts.type ?? "deep_work",
        ...(opts.plannedMinutes ? { plannedMinutes: opts.plannedMinutes } : {}),
        ...(opts.projectId ? { projectId: opts.projectId } : {}),
        ...(opts.plannerBlockId ? { plannerBlockId: opts.plannerBlockId } : {}),
      }),
    /** Start an unanchored session (or one tied only to a planner block). */
    startFocus: (opts: StartFocusOptions = {}) =>
      start.mutate({
        type: opts.type ?? "deep_work",
        ...(opts.plannedMinutes ? { plannedMinutes: opts.plannedMinutes } : {}),
        ...(opts.projectId ? { projectId: opts.projectId } : {}),
        ...(opts.plannerBlockId ? { plannerBlockId: opts.plannerBlockId } : {}),
      }),
  };
}
