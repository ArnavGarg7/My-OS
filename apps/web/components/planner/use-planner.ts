"use client";

import { useMemo } from "react";
import { utilization as computeUtilization } from "@myos/core/planner";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client planner controller (Sprint 2.6). Reads the day's plan and exposes the
 * generate / optimize / clear / lock / move mutations. Selection is shared with
 * the context panel via the shell store.
 */
export function usePlanner() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const selectedId = useShellStore((s) => s.selectedBlockId);
  const setSelectedId = useShellStore((s) => s.setSelectedBlockId);

  const plan = trpc.planner.get.useQuery({});
  const day = plan.data?.day ?? null;
  const blocks = useMemo(() => plan.data?.blocks ?? [], [plan.data]);
  const conflicts = plan.data?.conflicts ?? [];

  const util = useMemo(() => (day ? computeUtilization(day, blocks) : null), [day, blocks]);

  const refresh = () => {
    utils.planner.get.invalidate();
    utils.planner.summary.invalidate();
  };

  const generateM = trpc.planner.generate.useMutation({
    onSuccess: (plan) => {
      refresh();
      toaster.success("Plan generated");
      timeline.emit({
        kind: "planner.accepted",
        source: "planner",
        title: `Plan for ${plan.day?.date ?? "today"}`,
        meta: { blocks: plan.blocks?.length ?? 0 },
      });
      analytics.track({ kind: "planner.accepted" });
    },
    onError: (e) => toaster.error("Couldn't generate", e.message),
  });
  const optimizeM = trpc.planner.optimize.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Optimized");
    },
    onError: (e) => toaster.error("Couldn't optimize", e.message),
  });
  const clearM = trpc.planner.clear.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
      toaster.success("Plan cleared");
    },
    onError: (e) => toaster.error("Couldn't clear", e.message),
  });
  const action = {
    onSuccess: () => refresh(),
    onError: (e: { message: string }) => toaster.error("Couldn't update block", e.message),
  };
  const lockM = trpc.planner.lock.useMutation(action);
  const unlockM = trpc.planner.unlock.useMutation(action);
  const moveM = trpc.planner.move.useMutation(action);

  return {
    day,
    blocks,
    conflicts,
    utilization: util,
    isLoading: plan.isLoading,
    selected: blocks.find((b) => b.id === selectedId) ?? null,
    selectedId,
    select: (id: string | null) => setSelectedId(id),
    generate: () => generateM.mutate({}),
    optimize: () => optimizeM.mutate({}),
    clear: () => clearM.mutate({}),
    lock: (id: string) => lockM.mutate({ id }),
    unlock: (id: string) => unlockM.mutate({ id }),
    move: (id: string, direction: "earlier" | "later") => moveM.mutate({ id, direction }),
    pending:
      generateM.isPending ||
      optimizeM.isPending ||
      clearM.isPending ||
      lockM.isPending ||
      unlockM.isPending ||
      moveM.isPending,
  };
}
