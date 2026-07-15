"use client";

import { useMemo } from "react";
import { Activity, BatteryCharging, FileText, History, Sunrise } from "lucide-react";
import { Button } from "@myos/ui";
import { DAY_STATUSES, ENERGY_LEVELS } from "@myos/core/today";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/**
 * Today command group (Sprint 2.1). Registration only — status/energy pickers,
 * notes, decision history, and a disabled Morning Briefing entry. Mount in shell.
 */
function DecisionHistoryList() {
  const query = trpc.today.getDecisionHistory.useQuery({});
  if (query.isLoading) {
    return <p className="text-body-s text-fg-subtle py-6 text-center">Loading…</p>;
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <p className="text-body-s text-fg-subtle py-6 text-center">
        No decisions logged yet. The OS will record its recommendations here.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2 pt-2">
      {items.map((decision) => (
        <li key={decision.id} className="border-border rounded-md border p-3">
          <p className="text-body-m text-fg">{decision.decision}</p>
          {decision.reason ? <p className="text-body-s text-fg-subtle">{decision.reason}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function TodayCommands() {
  const { open } = useModal();
  const toaster = useToaster();
  const setQuickAddOpen = useShellStore((s) => s.setQuickAddOpen);
  const utils = trpc.useUtils();
  const { mutate: updateState } = trpc.today.updateState.useMutation({
    onSuccess: () => utils.today.getState.invalidate(),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const openStatusPicker = () =>
      open(
        (close) => (
          <div className="flex flex-col gap-2 pt-2">
            {DAY_STATUSES.map((status) => (
              <Button
                key={status}
                variant="secondary"
                className="justify-start capitalize"
                onClick={() => {
                  updateState({ status });
                  toaster.success(`Status set to ${status.replace(/_/g, " ")}`);
                  close();
                }}
              >
                {status.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        ),
        { title: "Update Today's Status", size: "sm" },
      );

    const openEnergyPicker = () =>
      open(
        (close) => (
          <div className="flex flex-col gap-2 pt-2">
            {ENERGY_LEVELS.map((level) => (
              <Button
                key={level}
                variant="secondary"
                className="justify-start capitalize"
                onClick={() => {
                  updateState({ energyLevel: level });
                  toaster.success(`Energy set to ${level}`);
                  close();
                }}
              >
                {level}
              </Button>
            ))}
          </div>
        ),
        { title: "Update Energy", size: "sm" },
      );

    const openDecisionHistory = () =>
      open(() => <DecisionHistoryList />, { title: "Decision History", size: "md" });

    return [
      {
        id: "today",
        title: "Today",
        category: "today",
        priority: 90,
        commands: [
          {
            id: "today:update-status",
            title: "Update Today's Status",
            category: "today",
            icon: Activity,
            keywords: ["status", "state", "today"],
            execute: (ctx) => {
              ctx.close();
              openStatusPicker();
            },
          },
          {
            id: "today:update-energy",
            title: "Update Energy",
            category: "today",
            icon: BatteryCharging,
            keywords: ["energy", "low", "medium", "high"],
            execute: (ctx) => {
              ctx.close();
              openEnergyPicker();
            },
          },
          {
            id: "today:open-notes",
            title: "Open Today's Notes",
            category: "today",
            icon: FileText,
            keywords: ["notes", "capture", "quick add"],
            execute: (ctx) => {
              ctx.close();
              setQuickAddOpen(true);
            },
          },
          {
            id: "today:decision-history",
            title: "Open Decision History",
            category: "today",
            icon: History,
            keywords: ["decisions", "history", "log"],
            execute: (ctx) => {
              ctx.close();
              openDecisionHistory();
            },
          },
          {
            id: "today:morning-briefing",
            title: "Jump to Morning Briefing",
            subtitle: "Coming in Sprint 2.2",
            category: "today",
            icon: Sunrise,
            keywords: ["morning", "briefing"],
            enabled: () => false,
            execute: (ctx) => {
              ctx.close();
              toaster.info("Morning Briefing arrives in Sprint 2.2");
            },
          },
        ],
      },
    ];
  }, [open, toaster, setQuickAddOpen, updateState]);

  useRegisterGroups(groups);
  return null;
}
