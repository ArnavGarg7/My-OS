"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  Flag,
  Lock,
  LockOpen,
  MoonStar,
  Sparkles,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/** Tomorrow Studio command group (Sprint 3.1). Registration only. Mount once. */
export function StudioCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const setStep = useShellStore((s) => s.setTomorrowStep);
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const finalize = trpc.tomorrow.finalize.useMutation({
    onSuccess: () => {
      utils.tomorrow.counts.invalidate();
      toaster.success("Tomorrow is ready ✨");
    },
  });
  const lock = trpc.tomorrow.lock.useMutation({
    onSuccess: () => utils.tomorrow.counts.invalidate(),
  });
  const reopen = trpc.tomorrow.reopen.useMutation({
    onSuccess: () => utils.tomorrow.counts.invalidate(),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const open = (step?: string) => {
      if (step) setStep(step);
      router.push("/tomorrow");
    };
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `tomorrow:${id}`,
      title,
      category: "tomorrow",
      icon,
      keywords: ["tomorrow", "evening", "plan", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "tomorrow",
        title: "Tomorrow Studio",
        category: "tomorrow",
        priority: 90,
        commands: [
          cmd("open", "Open Tomorrow Studio", MoonStar, ["studio"], () => open()),
          cmd("review", "Review Today", ClipboardList, ["review"], () => open("review")),
          cmd("carry", "Carry Forward", ArrowRightLeft, ["carry", "unfinished"], () =>
            open("carry_forward"),
          ),
          cmd("priorities", "Select Priorities", Flag, ["priorities"], () => open("priorities")),
          cmd("preview", "Preview Tomorrow", Sparkles, ["planner", "preview"], () =>
            open("planner"),
          ),
          cmd("readiness", "Tomorrow Readiness", MoonStar, ["readiness"], () => open("readiness")),
          cmd("checklist", "Mark Checklist", CheckSquare, ["checklist"], () => open("checklist")),
          cmd("finalize", "Finalize Tomorrow", Sunrise, ["finalize"], () => finalize.mutate({})),
          cmd("lock", "Lock Tomorrow Plan", Lock, ["lock"], () => lock.mutate()),
          cmd("reopen", "Reopen Tomorrow Plan", LockOpen, ["reopen"], () => reopen.mutate()),
          cmd("summary", "Show Tomorrow Summary", CalendarCheck, ["summary"], () => {
            open("finalize");
            openContextPanel(true);
          }),
        ],
      },
    ];
  }, [router, setStep, openContextPanel, finalize, lock, reopen]);

  useRegisterGroups(groups);
  return null;
}
