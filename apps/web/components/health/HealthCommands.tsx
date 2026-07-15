"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Apple,
  BatteryCharging,
  Bed,
  Droplet,
  Dumbbell,
  Gauge,
  HeartPulse,
  Play,
  Scale,
  Smile,
  Square,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button, Input } from "@myos/ui";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useHealthController } from "./use-health";

function QuickLogForm({ onLog, close }: { onLog: (t: string) => boolean; close: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. drank 500ml"
      />
      <div className="flex justify-end">
        <Button
          disabled={!text.trim()}
          onClick={() => {
            onLog(text.trim());
            close();
          }}
        >
          Log
        </Button>
      </div>
    </div>
  );
}

/** Health command group (Sprint 2.9). 14 commands. Registration only. */
export function HealthCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const { open } = useModal();
  const health = useHealthController();

  const groups = useMemo<CommandGroup[]>(() => {
    const go = () => router.push("/health");
    const quick = (title: string) => () =>
      open((close) => <QuickLogForm onLog={health.quickLog} close={close} />, {
        title,
        size: "sm",
      });

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `health:${id}`,
      title,
      category: "health",
      icon,
      keywords: ["health", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    const nextWorkout = () => health.workouts.find(() => true);

    return [
      {
        id: "health",
        title: "Health",
        category: "health",
        priority: 90,
        commands: [
          cmd("log-water", "Log Water", Droplet, ["water", "drink"], () => health.logWater(250)),
          cmd("log-meal", "Log Meal", Apple, ["meal", "food"], quick("Log meal")),
          cmd(
            "log-workout",
            "Log Workout",
            Dumbbell,
            ["workout", "exercise"],
            quick("Log workout"),
          ),
          cmd("log-sleep", "Log Sleep", Bed, ["sleep"], quick("Log sleep")),
          cmd("log-weight", "Log Weight", Scale, ["weight"], quick("Log weight")),
          cmd("energy", "Update Energy", Zap, ["energy"], () => {
            health.setEnergy("high");
            toaster.success("Energy set to high");
          }),
          cmd("mood", "Update Mood", Smile, ["mood"], () => {
            health.setMood("good");
            toaster.success("Mood set to good");
          }),
          cmd("start-workout", "Start Workout", Play, ["start", "workout"], quick("Start workout")),
          cmd("finish-workout", "Finish Workout", Square, ["finish", "workout"], () => {
            if (nextWorkout()) go();
            else toaster.info("No active workout.");
          }),
          cmd("start-recovery", "Start Recovery", BatteryCharging, ["recovery", "rest"], () => {
            toaster.info("Recovery day noted — keep it light.");
            go();
          }),
          cmd("trends", "View Trends", TrendingUp, ["trends"], go),
          cmd("dashboard", "Open Health Dashboard", HeartPulse, ["dashboard"], go),
          cmd("readiness", "Show Readiness", Gauge, ["readiness"], go),
          cmd("summary", "Health Summary", HeartPulse, ["summary"], go),
        ],
      },
    ];
  }, [router, toaster, open, health]);

  useRegisterGroups(groups);
  return null;
}
