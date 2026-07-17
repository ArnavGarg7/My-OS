"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Dumbbell,
  Droplet,
  HeartPulse,
  ListChecks,
  Pill,
  Repeat,
  Sparkles,
  Sunrise,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";

/** Life command group (Sprint 4.2). Registration only. Mount once. */
export function LifeCommands() {
  const router = useRouter();

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/life");
    const cmd = (id: string, title: string, icon: LucideIcon, keywords: string[]) => ({
      id: `life:${id}`,
      title,
      category: "life",
      icon,
      keywords: ["life", "personal", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        go();
      },
    });

    return [
      {
        id: "life",
        title: "Life",
        category: "life",
        priority: 81,
        commands: [
          cmd("open", "Open Life Dashboard", Activity, ["dashboard", "open"]),
          cmd("complete-habit", "Complete Habit", Repeat, ["habit", "complete"]),
          cmd("start-routine", "Start Routine", ListChecks, ["routine"]),
          cmd("morning-routine", "Start Morning Routine", Sunrise, ["morning", "routine"]),
          cmd("night-routine", "Start Night Routine", Sunrise, ["night", "evening", "routine"]),
          cmd("log-workout", "Log Workout", Dumbbell, ["workout", "gym"]),
          cmd("log-medication", "Log Medication", Pill, ["medication", "meds"]),
          cmd("log-water", "Log Water", Droplet, ["water", "hydration"]),
          cmd("log-meal", "Log Meal", Utensils, ["meal", "food"]),
          cmd("open-recovery", "Open Recovery", HeartPulse, ["recovery", "readiness"]),
          cmd("personal-review", "Open Personal Review", Sparkles, ["review"]),
          cmd("growth", "Open Growth Dashboard", Target, ["growth", "vision"]),
        ],
      },
    ];
  }, [router]);

  useRegisterGroups(groups);
  return null;
}
