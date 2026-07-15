"use client";

import { useMemo, useState } from "react";
import type { AutomationDraft, AutomationRule } from "@myos/core/automation";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Automation center controller (Sprint 3.4). Owns the rule list, the selected rule,
 * and every mutation (create/update/enable/disable/delete/execute/preview). Emits
 * timeline + analytics events. Deterministic — reflects engine state, drives it.
 */
export type AutomationView = "all" | "enabled" | "built-in" | "custom";

export function useAutomation() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const [view, setView] = useState<AutomationView>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = trpc.automation.list.useQuery(undefined, { refetchInterval: 120_000 });
  const summaryQuery = trpc.automation.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const historyQuery = trpc.automation.history.useQuery({ limit: 50 });
  const portfolioQuery = trpc.automation.statisticsPortfolio.useQuery();

  const refresh = () => {
    utils.automation.list.invalidate();
    utils.automation.summary.invalidate();
    utils.automation.history.invalidate();
    utils.automation.statisticsPortfolio.invalidate();
  };

  const createM = trpc.automation.create.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Automation created");
      timeline.emit({
        kind: "automation.created",
        source: "automation",
        title: "Automation created",
      });
    },
    onError: (e) => toaster.error(e.message),
  });
  const updateM = trpc.automation.update.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Automation updated");
      timeline.emit({
        kind: "automation.updated",
        source: "automation",
        title: "Automation updated",
      });
    },
    onError: (e) => toaster.error(e.message),
  });
  const deleteM = trpc.automation.delete.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
    onError: (e) => toaster.error(e.message),
  });
  const enableM = trpc.automation.enable.useMutation({ onSuccess: refresh });
  const disableM = trpc.automation.disable.useMutation({ onSuccess: refresh });
  const executeM = trpc.automation.execute.useMutation({
    onSuccess: (record) => {
      refresh();
      const ok = record.outcome === "completed";
      toaster[ok ? "success" : "info"](`Automation ${record.outcome}`);
      timeline.emit({
        kind: ok
          ? "automation.executed"
          : record.outcome === "failed"
            ? "automation.failed"
            : "automation.skipped",
        source: "automation",
        title: `Automation ${record.outcome}`,
      });
      analytics.track({ kind: "automation.executions", value: 1 });
      if (ok) analytics.track({ kind: "automation.success", value: 1 });
      else if (record.outcome === "failed")
        analytics.track({ kind: "automation.failure", value: 1 });
      else analytics.track({ kind: "automation.skipped", value: 1 });
    },
  });
  const previewM = trpc.automation.preview.useMutation();

  const allRules = useMemo(() => (listQuery.data ?? []) as AutomationRule[], [listQuery.data]);

  const rules = useMemo(() => {
    if (view === "enabled") return allRules.filter((r) => r.status === "enabled");
    if (view === "built-in") return allRules.filter((r) => r.builtIn);
    if (view === "custom") return allRules.filter((r) => !r.builtIn);
    return allRules;
  }, [allRules, view]);

  const selected = useMemo(
    () => allRules.find((r) => r.id === selectedId) ?? null,
    [allRules, selectedId],
  );

  return {
    view,
    setView,
    rules,
    allRules,
    selected,
    selectedId,
    setSelectedId,
    summary: summaryQuery.data ?? null,
    history: historyQuery.data ?? [],
    portfolio: portfolioQuery.data ?? null,
    isLoading: listQuery.isLoading,

    create: (draft: AutomationDraft) => createM.mutate(draft),
    update: (id: string, patch: Partial<AutomationDraft>) => updateM.mutate({ id, ...patch }),
    remove: (id: string) => deleteM.mutate({ id }),
    enable: (id: string) => enableM.mutate({ id }),
    disable: (id: string) => disableM.mutate({ id }),
    execute: (id: string) => executeM.mutate({ id }),
    preview: (id: string) => previewM.mutateAsync({ id }),
    previewData: previewM.data ?? null,
    pending: createM.isPending || updateM.isPending || executeM.isPending,
  };
}

export type UseAutomation = ReturnType<typeof useAutomation>;
