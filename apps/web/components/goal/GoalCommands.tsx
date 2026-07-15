"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CalendarRange,
  Check,
  Flag,
  LayoutDashboard,
  ListChecks,
  Search,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { useGoal } from "./use-goal";

/** Goal command group (Sprint 2.12). Registration only. Mount once in shell. */
export function GoalCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const goal = useGoal();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/goals");
    const need = () => toaster.info("Select a goal first.");

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `goal:${id}`,
      title,
      category: "goal",
      icon,
      keywords: ["goal", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "goal",
        title: "Goals",
        category: "goal",
        priority: 91,
        commands: [
          cmd("new", "New Goal", Flag, ["create"], go),
          cmd("new-objective", "New Objective", Target, ["objective"], () =>
            goal.selected ? go() : need(),
          ),
          cmd("new-kr", "New Key Result", ListChecks, ["key result", "kr"], () =>
            goal.selected ? go() : need(),
          ),
          cmd("complete-habit", "Complete Habit", Check, ["habit"], () => {
            const habit = goal.habits.find((h) => h.active);
            if (habit) goal.completeHabit(habit.id);
            else toaster.info("No active habits yet.");
          }),
          cmd("weekly", "Weekly Review", CalendarRange, ["review", "week"], () =>
            goal.selected ? goal.createReview(goal.selected.id, "weekly") : need(),
          ),
          cmd("monthly", "Monthly Review", CalendarRange, ["review", "month"], () =>
            goal.selected ? goal.createReview(goal.selected.id, "monthly") : need(),
          ),
          cmd("quarterly", "Quarterly Review", CalendarRange, ["review", "quarter"], () =>
            goal.selected ? goal.createReview(goal.selected.id, "quarterly") : need(),
          ),
          cmd("search", "Search Goals", Search, ["find"], go),
          cmd("dashboard", "Open Goal Dashboard", LayoutDashboard, ["dashboard"], go),
          cmd("summary", "Goal Summary", Sparkles, ["summary"], () => {
            go();
            openContextPanel(true);
          }),
          cmd("archive", "Archive Goal", Archive, ["archive"], () =>
            goal.selected ? goal.archive(goal.selected.id) : need(),
          ),
        ],
      },
    ];
  }, [router, toaster, goal, openContextPanel]);

  useRegisterGroups(groups);
  return null;
}
