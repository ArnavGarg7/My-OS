"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeTimer,
  type BreakType,
  type InterruptionType,
  type SessionType,
  type StartSessionInput,
} from "@myos/core/focus";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Focus workspace controller (Sprint 3.2). Owns the active-session queries, the live
 * `now` tick that drives the pure timer, the lifecycle mutations and the timeline +
 * analytics emits. The timer itself is pure — this hook only supplies `now`.
 */
export function useFocus() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const fullscreen = useShellStore((s) => s.focusFullscreen);
  const setFullscreen = useShellStore((s) => s.setFocusFullscreen);

  // Live clock — ticks every second while a session is active so the timer advances.
  const [now, setNow] = useState<Date>(() => new Date());

  const activeQuery = trpc.focus.active.useQuery(undefined, { refetchInterval: 30_000 });
  const readinessQuery = trpc.focus.readiness.useQuery(undefined, { refetchInterval: 300_000 });
  const recommendationsQuery = trpc.focus.recommendations.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const historyQuery = trpc.focus.history.useQuery({ limit: 20 });
  const summaryQuery = trpc.focus.summary.useQuery(undefined, { refetchInterval: 60_000 });

  const active = activeQuery.data ?? null;
  const isRunning = active?.status === "running";

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const timer = useMemo(() => (active ? computeTimer(active, now) : null), [active, now]);

  const refresh = () => {
    utils.focus.active.invalidate();
    utils.focus.summary.invalidate();
    utils.focus.metrics.invalidate();
    utils.focus.recommendations.invalidate();
    utils.focus.history.invalidate();
  };

  const startM = trpc.focus.start.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Focus session started");
      timeline.emit({ kind: "focus.started", source: "focus", title: "Focus started" });
    },
  });
  const pauseM = trpc.focus.pause.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "focus.paused", source: "focus", title: "Focus paused" });
    },
  });
  const resumeM = trpc.focus.resume.useMutation({ onSuccess: refresh });
  const completeM = trpc.focus.complete.useMutation({
    onSuccess: (s) => {
      refresh();
      toaster.success("Session complete 🎯");
      timeline.emit({ kind: "focus.completed", source: "focus", title: "Focus completed" });
      const mins = timer ? Math.round(timer.focusMs / 60_000) : s.plannedMinutes;
      analytics.track({ kind: "focus.minutes", value: mins });
      if (s.type === "deep_work" || s.type === "focus") {
        analytics.track({ kind: "deep_work.minutes", value: mins });
      }
      analytics.track({ kind: "focus.session_length", value: mins });
    },
  });
  const cancelM = trpc.focus.cancel.useMutation({ onSuccess: refresh });
  const breakM = trpc.focus.break.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "focus.break", source: "focus", title: "Break taken" });
    },
  });
  const interruptM = trpc.focus.addInterruption.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "focus.interruption", source: "focus", title: "Interruption" });
      analytics.track({ kind: "focus.interruptions", value: 1 });
    },
  });
  const switchM = trpc.focus.switchTask.useMutation({ onSuccess: refresh });
  const notesM = trpc.focus.setNotes.useMutation({
    onSuccess: () => utils.focus.active.invalidate(),
  });

  const pending =
    startM.isPending ||
    pauseM.isPending ||
    resumeM.isPending ||
    completeM.isPending ||
    cancelM.isPending;

  return {
    now,
    active,
    timer,
    readiness: readinessQuery.data ?? null,
    recommendations: recommendationsQuery.data ?? [],
    history: historyQuery.data ?? [],
    summary: summaryQuery.data ?? null,
    isLoading: activeQuery.isLoading,
    pending,

    fullscreen,
    setFullscreen,

    start: (input: StartSessionInput) => startM.mutate(input),
    startType: (type: SessionType, plannedMinutes?: number) =>
      startM.mutate({ type, ...(plannedMinutes ? { plannedMinutes } : {}) }),
    pause: () => active && pauseM.mutate({ sessionId: active.id }),
    resume: () => active && resumeM.mutate({ sessionId: active.id }),
    complete: (energyAfter?: number | null) =>
      active && completeM.mutate({ sessionId: active.id, energyAfter: energyAfter ?? null }),
    cancel: () => active && cancelM.mutate({ sessionId: active.id }),
    takeBreak: (type?: BreakType, minutes?: number) =>
      active &&
      breakM.mutate({
        sessionId: active.id,
        ...(type ? { type } : {}),
        ...(minutes ? { minutes } : {}),
      }),
    addInterruption: (type: InterruptionType, note?: string) =>
      active && interruptM.mutate({ sessionId: active.id, type, ...(note ? { note } : {}) }),
    switchTask: (target: { taskId?: string | null; projectId?: string | null }) =>
      active && switchM.mutate({ sessionId: active.id, ...target }),
    setNotes: (notes: string) => active && notesM.mutate({ sessionId: active.id, notes }),
  };
}

export type UseFocus = ReturnType<typeof useFocus>;
