"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  ClipboardCheck,
  FileText,
  Flag,
  Grid3x3,
  LayoutDashboard,
  Radar,
  type LucideIcon,
} from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";

/** Intelligence command group (Sprint 4.4). Registration only. Mount once. */
export function IntelligenceCommands() {
  const router = useRouter();

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/dashboard");
    const cmd = (id: string, title: string, icon: LucideIcon, keywords: string[]) => ({
      id: `intelligence:${id}`,
      title,
      category: "dashboard",
      icon,
      keywords: ["dashboard", "life", "executive", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        go();
      },
    });

    return [
      {
        id: "dashboard",
        title: "Dashboard",
        category: "dashboard",
        priority: 90,
        commands: [
          cmd("open", "Open Dashboard", LayoutDashboard, ["open", "executive"]),
          cmd("generate-report", "Generate Report", FileText, ["report", "generate"]),
          cmd("open-reviews", "Open Reviews", ClipboardCheck, ["review"]),
          cmd("view-wheel", "View Wheel of Life", Radar, ["wheel", "radar"]),
          cmd("life-areas", "Review Life Areas", BarChart3, ["areas", "balance"]),
          cmd("attention", "Open Attention", Grid3x3, ["attention", "priorities"]),
          cmd("milestones", "View Milestones", Flag, ["milestone"]),
          cmd("achievements", "View Achievements", Award, ["achievement", "badge"]),
          cmd("weekly-review", "Weekly Review", ClipboardCheck, ["weekly", "review"]),
          cmd("monthly-review", "Monthly Review", ClipboardCheck, ["monthly", "review"]),
          cmd("quarterly-review", "Quarterly Review", ClipboardCheck, ["quarterly", "review"]),
          cmd("yearly-review", "Yearly Review", ClipboardCheck, ["yearly", "annual", "review"]),
        ],
      },
    ];
  }, [router]);

  useRegisterGroups(groups);
  return null;
}
