"use client";

import { useMemo } from "react";
import { Expand, Minimize } from "lucide-react";
import { Button } from "@myos/ui";
import { PRIORITY_WEIGHT, selectOpen } from "@myos/core/task";
import { trpc } from "@/lib/trpc/client";
import type { UseFocus } from "./use-focus";
import { StartPanel } from "./StartPanel";
import { SessionTimer } from "./SessionTimer";
import { ActiveTask } from "./ActiveTask";
import { SessionControls } from "./SessionControls";
import { BreakCard } from "./BreakCard";
import { InterruptionPanel } from "./InterruptionPanel";
import { NotesPanel } from "./NotesPanel";
import { Recommendations } from "./Recommendations";
import { ReadinessCard } from "./ReadinessCard";

/**
 * FocusWorkspace (Sprint 3.2). The distraction-free deep-work surface. Vertical
 * rhythm: large timer → current task → controls → interruptions/notes →
 * recommendations. Renders the idle StartPanel when there's no active session and the
 * BreakCard while on a break. Shared by the normal page and the fullscreen overlay.
 */
export function FocusWorkspace({ focus }: { focus: UseFocus }) {
  const { active, timer } = focus;

  // Resolve the anchored task's title so the session shows what it's FOR — the
  // one extra query only runs while a task-linked session is active.
  const taskId = active?.taskId ?? null;
  const linkedTask = trpc.task.get.useQuery(
    { id: taskId ?? "" },
    { enabled: Boolean(taskId), staleTime: 60_000 },
  );
  const taskTitle = taskId ? (linkedTask.data?.title ?? null) : null;

  // Open tasks to offer as focus anchors (only fetched while idle — the picker
  // is the only consumer).
  const idle = !active || active.status === "idle";
  const openTasksQuery = trpc.task.list.useQuery(
    { limit: 100 },
    { enabled: idle, staleTime: 60_000 },
  );
  const openTasks = useMemo(() => {
    const open = selectOpen(openTasksQuery.data ?? []);
    return [...open]
      .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])
      .map((t) => ({ id: t.id, title: t.title }));
  }, [openTasksQuery.data]);

  if (!active || active.status === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <FullscreenToggle focus={focus} />
        </div>
        {focus.readiness ? <ReadinessCard readiness={focus.readiness} /> : null}
        <StartPanel
          tasks={openTasks}
          onStart={(input) =>
            focus.start({
              type: input.type,
              plannedMinutes: input.minutes,
              ...(input.taskId ? { taskId: input.taskId } : {}),
            })
          }
          pending={focus.pending}
        />
        <Recommendations items={focus.recommendations} />
      </div>
    );
  }

  if (active.status === "break") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex justify-end">
          <FullscreenToggle focus={focus} />
        </div>
        <BreakCard session={active} onResume={focus.resume} pending={focus.pending} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6">
      <div className="flex w-full justify-end">
        <FullscreenToggle focus={focus} />
      </div>

      {timer ? <SessionTimer session={active} timer={timer} /> : null}
      <ActiveTask session={active} taskTitle={taskTitle} />
      <SessionControls
        session={active}
        pending={focus.pending}
        onPause={focus.pause}
        onResume={focus.resume}
        onBreak={() => focus.takeBreak()}
        onComplete={() => focus.complete()}
        onCancel={focus.cancel}
      />

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <InterruptionPanel
          count={active.interruptions.length}
          onLog={focus.addInterruption}
          disabled={focus.pending}
        />
        <NotesPanel value={active.notes} onSave={focus.setNotes} disabled={focus.pending} />
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Recommendations items={focus.recommendations} />
        {focus.readiness ? <ReadinessCard readiness={focus.readiness} /> : null}
      </div>
    </div>
  );
}

function FullscreenToggle({ focus }: { focus: UseFocus }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => focus.setFullscreen(!focus.fullscreen)}
      aria-label={focus.fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {focus.fullscreen ? <Minimize size={14} aria-hidden /> : <Expand size={14} aria-hidden />}
      {focus.fullscreen ? "Exit" : "Fullscreen"}
    </Button>
  );
}
