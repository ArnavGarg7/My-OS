"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  CalendarRange,
  CalendarSearch,
  Clock,
  Pin,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";

/** Timeline command group (Sprint 2.13). Registration only. Mount once in shell. */
export function TimelineCommands() {
  const router = useRouter();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);
  const clearSelection = useShellStore((s) => s.setSelectedTimelineEventId);

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/timeline");
    const goPanel = () => {
      clearSelection(null);
      go();
      openContextPanel(true);
    };

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `timeline:${id}`,
      title,
      category: "timeline",
      icon,
      keywords: ["timeline", "history", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "timeline",
        title: "Timeline",
        category: "timeline",
        priority: 88,
        commands: [
          cmd("search", "Search Timeline", Search, ["find"], go),
          cmd("today", "Today's Timeline", Sun, ["today"], go),
          cmd("weekly", "Weekly Review", CalendarRange, ["review", "week"], goPanel),
          cmd("monthly", "Monthly Review", CalendarRange, ["review", "month"], goPanel),
          cmd("jump", "Jump to Date", CalendarSearch, ["date", "jump"], go),
          cmd("memories", "View Memories", Pin, ["memories", "pinned"], goPanel),
          cmd("highlights", "View Highlights", Award, ["highlights", "best"], goPanel),
          cmd("snapshots", "View Snapshots", CalendarRange, ["snapshots", "reviews"], goPanel),
          cmd("stats", "Timeline Statistics", BarChart3, ["stats", "statistics"], goPanel),
          cmd("open", "Open Timeline", Clock, ["open"], go),
        ],
      },
    ];
  }, [router, openContextPanel, clearSelection]);

  useRegisterGroups(groups);
  return null;
}
