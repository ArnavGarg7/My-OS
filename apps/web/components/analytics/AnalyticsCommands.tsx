"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  GitCompareArrows,
  HeartPulse,
  LayoutDashboard,
  Target,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { trpc } from "@/lib/trpc/client";

/** Analytics command group (Sprint 2.14). Registration only. Mount once in shell. */
export function AnalyticsCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const generate = trpc.analytics.generateReport.useMutation({
    onSuccess: (r) => toaster.success("Report generated", r.report.reportType),
    onError: (e) => toaster.error("Couldn't generate report", e.message),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/analytics");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `analytics:${id}`,
      title,
      category: "analytics",
      icon,
      keywords: ["analytics", "report", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "analytics",
        title: "Analytics",
        category: "analytics",
        priority: 86,
        commands: [
          cmd("dashboard", "Open Analytics", LayoutDashboard, ["dashboard"], go),
          cmd("weekly", "Weekly Review", CalendarRange, ["week", "review"], go),
          cmd("monthly", "Monthly Review", CalendarRange, ["month", "review"], go),
          cmd("quarterly", "Quarterly Review", CalendarRange, ["quarter"], go),
          cmd("yearly", "Year Review", CalendarRange, ["year"], go),
          cmd("productivity", "Productivity Report", BarChart3, ["productivity"], go),
          cmd("focus", "Focus Report", Zap, ["focus"], go),
          cmd("health", "Health Report", HeartPulse, ["health"], go),
          cmd("finance", "Finance Report", Wallet, ["finance"], go),
          cmd("goals", "Goal Report", Target, ["goals"], go),
          cmd("compare", "Compare Periods", GitCompareArrows, ["compare"], go),
          cmd("export", "Export Report", TrendingUp, ["export", "generate"], () =>
            generate.mutate({ type: "weekly" }),
          ),
        ],
      },
    ];
  }, [router, generate]);

  useRegisterGroups(groups);
  return null;
}
