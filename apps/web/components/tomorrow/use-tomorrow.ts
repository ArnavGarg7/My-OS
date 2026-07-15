"use client";

import { useMemo, useState } from "react";
import { STUDIO_STEPS, nextStep, previousStep, type StudioStep } from "@myos/core/tomorrow";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Tomorrow Studio controller (Sprint 3.1). Owns the guided workflow: the active
 * step, explicit carry-forward + priority selections, and the mutations that
 * persist the plan. Emits timeline + analytics events. Nothing carries forward or
 * finalises without the user acting.
 */
export function useTomorrow() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  // The active step lives in the shell store so the Command Center can jump to a
  // step. Guard against any invalid/persisted value (defaults to "review").
  const rawStep = useShellStore((s) => s.tomorrowStep);
  const setStep = useShellStore((s) => s.setTomorrowStep);
  const step: StudioStep = (STUDIO_STEPS as readonly string[]).includes(rawStep)
    ? (rawStep as StudioStep)
    : "review";

  const [acceptedCarry, setAcceptedCarry] = useState<Set<string>>(new Set());
  const [chosenPriorities, setChosenPriorities] = useState<Set<string>>(new Set());

  const getQuery = trpc.tomorrow.get.useQuery();
  const state = getQuery.data?.state ?? null;

  const refresh = () => {
    utils.tomorrow.get.invalidate();
    utils.tomorrow.counts.invalidate();
  };

  const previewM = trpc.tomorrow.preview.useMutation({
    onSuccess: (p) => {
      toaster.success(p.status === "discarded" ? "Draft discarded" : "Plan previewed");
      timeline.emit({
        kind: "planner.accepted",
        source: "planner",
        title: "Tomorrow plan previewed",
      });
      analytics.track({ kind: "planner.accuracy", value: p.utilization });
    },
  });
  const savePrioritiesM = trpc.tomorrow.savePriorities.useMutation({ onSuccess: refresh });
  const toggleChecklistM = trpc.tomorrow.toggleChecklist.useMutation({
    onSuccess: () => utils.tomorrow.get.invalidate(),
  });
  const finalizeM = trpc.tomorrow.finalize.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Tomorrow is ready ✨");
      timeline.emit({ kind: "review.completed", source: "planner", title: "Tomorrow finalized" });
      analytics.track({ kind: "planner.accuracy", value: state?.readiness.score ?? 0 });
    },
  });
  const lockM = trpc.tomorrow.lock.useMutation({ onSuccess: refresh });
  const reopenM = trpc.tomorrow.reopen.useMutation({ onSuccess: refresh });

  const priorityView = useMemo(() => state?.priorities.ranked ?? [], [state]);

  return {
    step,
    goToStep: (s: StudioStep) => setStep(s),
    next: () => {
      const n = nextStep(step);
      if (n) setStep(n);
    },
    prev: () => {
      const p = previousStep(step);
      if (p) setStep(p);
    },
    steps: STUDIO_STEPS,
    plan: getQuery.data?.plan ?? null,
    state,
    savedPriorities: getQuery.data?.savedPriorities ?? [],
    isLoading: getQuery.isLoading,

    acceptedCarry,
    toggleCarry: (id: string) =>
      setAcceptedCarry((prev) => {
        const nextSet = new Set(prev);
        if (nextSet.has(id)) nextSet.delete(id);
        else nextSet.add(id);
        return nextSet;
      }),

    chosenPriorities,
    togglePriority: (id: string) =>
      setChosenPriorities((prev) => {
        const nextSet = new Set(prev);
        if (nextSet.has(id)) nextSet.delete(id);
        else if (nextSet.size < 5) nextSet.add(id);
        return nextSet;
      }),
    priorityView,

    preview: (action?: "accept" | "regenerate" | "discard") =>
      previewM.mutate({ ...(action ? { action } : {}) }),
    previewData: previewM.data ?? null,
    previewing: previewM.isPending,

    savePriorities: () => {
      const chosen = priorityView
        .filter((p) => chosenPriorities.has(p.id))
        .map((p) => ({ title: p.title, ...(p.kind === "task" ? { taskId: p.entityId } : {}) }));
      savePrioritiesM.mutate({ priorities: chosen });
    },
    toggleChecklist: (itemId: string, completed: boolean) =>
      toggleChecklistM.mutate({ itemId, completed }),
    finalize: () => finalizeM.mutate({}),
    lock: () => lockM.mutate(),
    reopen: () => reopenM.mutate(),
    pending: finalizeM.isPending || savePrioritiesM.isPending,
  };
}
