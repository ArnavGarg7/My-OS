"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BatteryCharging, CheckCircle2, History, Lightbulb, Sunrise, Target } from "lucide-react";
import { Button, Input } from "@myos/ui";
import { ENERGY_LEVELS } from "@myos/core/today";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useMorningFlash } from "@/lib/today/morning-flash";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning command group (Sprint 2.2). Registration only — completion, mission +
 * energy editors, and jump-to-section shortcuts. Mount once in the shell.
 */
function MissionEditor({
  onSave,
  close,
}: {
  onSave: (m: string | null) => void;
  close: () => void;
}) {
  const [value, setValue] = useState("");
  const save = () => {
    onSave(value.trim() || null);
    close();
  };
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Today's mission"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button onClick={save}>Save mission</Button>
      </div>
    </div>
  );
}

export function MorningCommands() {
  const router = useRouter();
  const { open } = useModal();
  const toaster = useToaster();
  const flash = useMorningFlash((s) => s.flash);
  const utils = trpc.useUtils();

  const { mutate: updateState } = trpc.today.updateState.useMutation({
    onSuccess: () => utils.today.getState.invalidate(),
  });
  const { mutate: updateFocus } = trpc.today.updateFocus.useMutation({
    onSuccess: () => utils.today.getFocus.invalidate(),
  });
  const { mutate: completeMorning } = trpc.today.completeMorning.useMutation({
    onSuccess: () => {
      utils.today.getState.invalidate();
      flash();
      toaster.success("Morning Complete ✓");
    },
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const jumpTo = (id: string) => {
      const el = typeof document !== "undefined" ? document.getElementById(id) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else router.push("/today");
    };

    const openMission = () =>
      open((close) => <MissionEditor onSave={(m) => updateFocus({ mission: m })} close={close} />, {
        title: "Update Mission",
        size: "sm",
      });

    const openEnergy = () =>
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

    return [
      {
        id: "morning",
        title: "Morning",
        category: "morning",
        priority: 95,
        commands: [
          {
            id: "morning:complete",
            title: "Complete Morning Briefing",
            category: "morning",
            icon: CheckCircle2,
            keywords: ["complete", "done", "morning", "check-in"],
            execute: (ctx) => {
              ctx.close();
              completeMorning({});
            },
          },
          {
            id: "morning:update-mission",
            title: "Update Mission",
            category: "morning",
            icon: Target,
            keywords: ["mission", "goal", "focus"],
            execute: (ctx) => {
              ctx.close();
              openMission();
            },
          },
          {
            id: "morning:update-energy",
            title: "Update Energy",
            category: "morning",
            icon: BatteryCharging,
            keywords: ["energy", "low", "medium", "high"],
            execute: (ctx) => {
              ctx.close();
              openEnergy();
            },
          },
          {
            id: "morning:jump-recommendation",
            title: "Jump to Recommendation",
            category: "morning",
            icon: Lightbulb,
            keywords: ["recommendation", "advice", "next"],
            execute: (ctx) => {
              ctx.close();
              jumpTo("morning-recommendation");
            },
          },
          {
            id: "morning:review-yesterday",
            title: "Review Yesterday",
            category: "morning",
            icon: History,
            keywords: ["yesterday", "review", "history"],
            execute: (ctx) => {
              ctx.close();
              jumpTo("morning-yesterday");
            },
          },
          {
            id: "morning:checkin",
            title: "Morning Check-in",
            category: "morning",
            icon: Sunrise,
            keywords: ["check-in", "energy", "start"],
            execute: (ctx) => {
              ctx.close();
              jumpTo("morning-energy");
            },
          },
        ],
      },
    ];
  }, [router, open, updateState, updateFocus, completeMorning]);

  useRegisterGroups(groups);
  return null;
}
