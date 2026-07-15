"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Eye, History, LifeBuoy, Play, Workflow, type LucideIcon } from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/** Orchestration command group (Sprint 3.5). Registration only. Mount once. */
export function OrchestrationCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const refresh = () => {
    utils.orchestration.summary.invalidate();
    utils.orchestration.history.invalidate();
  };
  const run = trpc.orchestration.run.useMutation({
    onSuccess: (r) => {
      refresh();
      toaster.info(r ? `Orchestration ${r.status}` : "No pipeline matched");
    },
    onError: (e) => toaster.error(e.message),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/orchestration");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      exec: () => void,
    ) => ({
      id: `orchestration:${id}`,
      title,
      category: "orchestration",
      icon,
      keywords: ["orchestration", "system", "pipeline", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        exec();
      },
    });

    return [
      {
        id: "orchestration",
        title: "Orchestration",
        category: "orchestration",
        priority: 83,
        commands: [
          cmd("open", "Open Orchestration Center", Workflow, ["open", "center"], go),
          cmd("run-morning", "Run Morning Pipeline", Play, ["run", "morning"], () =>
            run.mutate({ event: "morning.complete", source: "manual" }),
          ),
          cmd("run-planner", "Run Planner Pipeline", Play, ["run", "planner"], () =>
            run.mutate({ event: "planner.generated", source: "manual" }),
          ),
          cmd("history", "Orchestration History", History, ["history", "runs"], go),
          cmd("recovery", "Recovery View", LifeBuoy, ["recovery", "failures"], () => {
            go();
            openContextPanel(true);
          }),
          cmd("statistics", "Orchestration Statistics", BarChart3, ["stats"], go),
          cmd("preview", "Preview a Pipeline", Eye, ["preview", "simulate"], go),
        ],
      },
    ];
  }, [router, run, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
