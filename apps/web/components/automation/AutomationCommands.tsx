"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Eye,
  History,
  ListChecks,
  Play,
  Plus,
  Power,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/** Automation command group (Sprint 3.4). Registration only. Mount once. */
export function AutomationCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const list = trpc.automation.list.useQuery(undefined, { staleTime: 60_000 });
  const refresh = () => {
    utils.automation.list.invalidate();
    utils.automation.summary.invalidate();
  };
  const execute = trpc.automation.execute.useMutation({
    onSuccess: (r) => {
      refresh();
      toaster.info(`Automation ${r.outcome}`);
    },
  });
  const enable = trpc.automation.enable.useMutation({ onSuccess: refresh });
  const disable = trpc.automation.disable.useMutation({ onSuccess: refresh });

  const groups = useMemo<CommandGroup[]>(() => {
    const firstRule = list.data?.[0]?.id ?? null;
    const go = () => router.push("/automation");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `automation:${id}`,
      title,
      category: "automation",
      icon,
      keywords: ["automation", "rule", "workflow", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "automation",
        title: "Automation",
        category: "automation",
        priority: 84,
        commands: [
          cmd("open", "Open Automation Center", Zap, ["open", "center"], go),
          cmd("create", "Create Rule", Plus, ["new", "create"], () => {
            go();
          }),
          cmd("execute", "Execute Rule", Play, ["run", "execute"], () => {
            if (firstRule) execute.mutate({ id: firstRule });
          }),
          cmd("enable", "Enable Rule", Power, ["enable"], () => {
            if (firstRule) enable.mutate({ id: firstRule });
          }),
          cmd("disable", "Disable Rule", Power, ["disable"], () => {
            if (firstRule) disable.mutate({ id: firstRule });
          }),
          cmd("history", "Automation History", History, ["history", "log"], go),
          cmd("statistics", "Automation Statistics", BarChart3, ["stats"], go),
          cmd("preview", "Preview Rule", Eye, ["preview", "simulate"], go),
          cmd("built-in", "Run Built-in Rules", Sparkles, ["built-in", "seed"], go),
          cmd("pending", "Pending Executions", ListChecks, ["pending", "approval"], () => {
            go();
            openContextPanel(true);
          }),
        ],
      },
    ];
  }, [list.data, router, execute, enable, disable, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
