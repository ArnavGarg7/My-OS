"use client";

import { useMemo, useState } from "react";
import type { ExecutionPlan, OrchestrationRun } from "@myos/core/orchestration";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Orchestration center controller (Sprint 3.5). Owns the run history, the selected run,
 * the preview plan and the run/preview mutations. Emits timeline + analytics events.
 * Deterministic — it reflects engine state and asks the engine to run a pipeline; it
 * never implements any module's logic itself.
 */
export function useOrchestration() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExecutionPlan | null>(null);

  const summaryQuery = trpc.orchestration.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const historyQuery = trpc.orchestration.history.useQuery({ limit: 50 });
  const statisticsQuery = trpc.orchestration.statistics.useQuery();
  const failuresQuery = trpc.orchestration.failures.useQuery({ limit: 50 });
  const recoveryQuery = trpc.orchestration.recovery.useQuery({ limit: 50 });

  const refresh = () => {
    utils.orchestration.summary.invalidate();
    utils.orchestration.history.invalidate();
    utils.orchestration.statistics.invalidate();
    utils.orchestration.failures.invalidate();
    utils.orchestration.recovery.invalidate();
  };

  const previewM = trpc.orchestration.preview.useMutation();
  const runM = trpc.orchestration.run.useMutation({
    onSuccess: (run) => {
      refresh();
      if (!run) {
        toaster.info("No pipeline matches that event");
        return;
      }
      setSelectedId(run.id);
      const failed = run.status === "failed";
      toaster[failed ? "error" : "success"](`Orchestration ${run.status}`);
      timeline.emit({
        kind: failed
          ? "orchestration.failed"
          : run.status === "recovered"
            ? "orchestration.recovered"
            : "orchestration.completed",
        source: "orchestration",
        title: run.summary,
      });
      analytics.track({ kind: "orchestration.pipeline.executions", value: 1 });
      analytics.track({ kind: "orchestration.runtime", value: (run.runtimeMs ?? 0) / 60000 });
      if (run.failures > 0)
        analytics.track({ kind: "orchestration.failures", value: run.failures });
      if (run.recoveries > 0)
        analytics.track({ kind: "orchestration.recoveries", value: run.recoveries });
      if (run.skipped.length > 0)
        analytics.track({ kind: "orchestration.pipeline.skipped", value: run.skipped.length });
    },
    onError: (e) => toaster.error(e.message),
  });

  const history = useMemo(
    () => (historyQuery.data ?? []) as OrchestrationRun[],
    [historyQuery.data],
  );
  const selected = useMemo(
    () => history.find((r) => r.id === selectedId) ?? null,
    [history, selectedId],
  );

  return {
    summary: summaryQuery.data ?? null,
    statistics: statisticsQuery.data ?? null,
    history,
    failures: failuresQuery.data ?? [],
    recovery: recoveryQuery.data ?? [],
    selected,
    selectedId,
    setSelectedId,
    isLoading: historyQuery.isLoading,

    preview,
    runEvent: (event: string) => runM.mutate({ event, source: "manual" }),
    previewEvent: async (event: string) => {
      const plan = await previewM.mutateAsync({ event });
      setPreview(plan ?? null);
      if (plan)
        timeline.emit({
          kind: "orchestration.previewed",
          source: "orchestration",
          title: `Previewed ${plan.pipeline} pipeline`,
        });
      return plan;
    },
    clearPreview: () => setPreview(null),
    pending: runM.isPending,
    previewing: previewM.isPending,
  };
}

export type UseOrchestration = ReturnType<typeof useOrchestration>;
