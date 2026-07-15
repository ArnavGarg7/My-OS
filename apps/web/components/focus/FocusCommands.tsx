"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Brain,
  Check,
  Coffee,
  Expand,
  Pause,
  Play,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/**
 * Focus command group (Sprint 3.2). Registration only — mount once. Starting a
 * session, controlling the active one, logging an interruption, toggling fullscreen.
 */
export function FocusCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const toggleFullscreen = useShellStore((s) => s.toggleFocusFullscreen);
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const active = trpc.focus.active.useQuery();
  const refresh = () => {
    utils.focus.active.invalidate();
    utils.focus.summary.invalidate();
  };
  const start = trpc.focus.start.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Focus session started");
    },
  });
  const pause = trpc.focus.pause.useMutation({ onSuccess: refresh });
  const resume = trpc.focus.resume.useMutation({ onSuccess: refresh });
  const complete = trpc.focus.complete.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Session complete 🎯");
    },
  });
  const takeBreak = trpc.focus.break.useMutation({ onSuccess: refresh });
  const interrupt = trpc.focus.addInterruption.useMutation({ onSuccess: refresh });

  const groups = useMemo<CommandGroup[]>(() => {
    const activeId = active.data?.id ?? null;
    const go = () => router.push("/focus");
    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `focus:${id}`,
      title,
      category: "focus",
      icon,
      keywords: ["focus", "deep work", "session", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "focus",
        title: "Focus",
        category: "focus",
        priority: 88,
        commands: [
          cmd("open", "Open Focus Mode", Timer, ["open", "workspace"], go),
          cmd("start", "Start Focus Session", Play, ["start"], () => {
            go();
            start.mutate({ type: "focus" });
          }),
          cmd("deep", "Start Deep Work", Brain, ["deep"], () => {
            go();
            start.mutate({ type: "deep_work", plannedMinutes: 90 });
          }),
          cmd("shallow", "Start Shallow Work", Target, ["shallow", "admin"], () => {
            go();
            start.mutate({ type: "shallow_work" });
          }),
          cmd("review", "Start Review Session", Sparkles, ["review"], () => {
            go();
            start.mutate({ type: "review", plannedMinutes: 30 });
          }),
          cmd("pause", "Pause Session", Pause, ["pause"], () => {
            if (activeId) pause.mutate({ sessionId: activeId });
          }),
          cmd("resume", "Resume Session", Play, ["resume"], () => {
            if (activeId) resume.mutate({ sessionId: activeId });
          }),
          cmd("break", "Take a Break", Coffee, ["break", "rest"], () => {
            if (activeId) takeBreak.mutate({ sessionId: activeId });
          }),
          cmd("complete", "Complete Session", Check, ["complete", "finish"], () => {
            if (activeId) complete.mutate({ sessionId: activeId });
          }),
          cmd("interruption", "Log Interruption", Bell, ["interruption", "distraction"], () => {
            if (activeId) interrupt.mutate({ sessionId: activeId, type: "distraction" });
          }),
          cmd("fullscreen", "Toggle Fullscreen Focus", Expand, ["fullscreen", "zen"], () => {
            go();
            toggleFullscreen();
          }),
          cmd("summary", "Show Focus Summary", Timer, ["summary", "metrics"], () => {
            go();
            openContextPanel(true);
          }),
        ],
      },
    ];
  }, [
    active.data,
    router,
    start,
    pause,
    resume,
    complete,
    takeBreak,
    interrupt,
    toggleFullscreen,
    openContextPanel,
  ]);

  useRegisterGroups(groups);
  return null;
}
