"use client";

import { useMemo, useState } from "react";
import {
  filterTasks,
  searchTasks,
  sortTasks,
  type RecurrenceFrequency,
  type TaskPriority,
  type TaskSort,
  type TaskStatus,
} from "@myos/core/task";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client task controller (Sprint 2.5). Fetches all tasks once and derives the
 * current view deterministically with the pure engine (filter + search + sort).
 * Exposes the full lifecycle + dependency + scheduling mutations. Selection is
 * shared with the context panel via the shell store.
 */
export function useTask() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const selectedId = useShellStore((s) => s.selectedTaskId);
  const setSelectedId = useShellStore((s) => s.setSelectedTaskId);

  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [labelId, setLabelId] = useState<string | null>(null);
  const [sort, setSort] = useState<TaskSort>("priority");
  const [text, setText] = useState("");

  const listQuery = trpc.task.list.useQuery({ limit: 500 });
  const labelsQuery = trpc.task.labels.useQuery();
  const countsQuery = trpc.task.counts.useQuery(undefined, { refetchInterval: 60_000 });

  const tasks = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const view = useMemo(() => {
    const filtered = filterTasks(tasks, {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(labelId ? { labelId } : {}),
    });
    const searched = text.trim() ? searchTasks(filtered, text) : filtered;
    // Hide archived unless explicitly filtered to it.
    const visible =
      status === "archived" ? searched : searched.filter((t) => t.status !== "archived");
    return sortTasks(visible, sort);
  }, [tasks, status, priority, labelId, text, sort]);

  const refresh = () => {
    utils.task.list.invalidate();
    utils.task.counts.invalidate();
  };

  const action = {
    onSuccess: () => refresh(),
    onError: (e: { message: string }) => toaster.error("Couldn't update task", e.message),
  };
  const createM = trpc.task.create.useMutation({
    onSuccess: (task) => {
      refresh();
      toaster.success("Task created");
      timeline.emit({
        kind: "task.created",
        source: "task",
        title: task.title,
        meta: { id: task.id },
      });
      analytics.track({ kind: "task.created" });
    },
    onError: (e) => toaster.error("Couldn't create task", e.message),
  });
  const updateM = trpc.task.update.useMutation(action);
  const completeM = trpc.task.complete.useMutation({
    onSuccess: (task) => {
      refresh();
      timeline.emit({
        kind: "task.completed",
        source: "task",
        title: task.title,
        meta: { id: task.id },
      });
      analytics.track({ kind: "task.completed" });
    },
    onError: (e: { message: string }) => toaster.error("Couldn't update task", e.message),
  });
  const archiveM = trpc.task.archive.useMutation(action);
  const deleteM = trpc.task.delete.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
    onError: (e) => toaster.error("Couldn't delete task", e.message),
  });
  const scheduleM = trpc.task.schedule.useMutation({
    onSuccess: (res) => {
      refresh();
      if (res.result.recommendedStart) {
        toaster.success(
          "Scheduled",
          res.result.overflow ? "Runs past your working hours." : undefined,
        );
      } else {
        toaster.info("No slot today", "The working window is full.");
      }
    },
    onError: (e) => toaster.error("Couldn't schedule", e.message),
  });
  const addDepM = trpc.task.addDependency.useMutation(action);
  const removeDepM = trpc.task.removeDependency.useMutation(action);
  const recurringM = trpc.task.recurring.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Recurrence set");
    },
    onError: (e) => toaster.error("Couldn't set recurrence", e.message),
  });

  return {
    tasks,
    view,
    isLoading: listQuery.isLoading,
    counts: countsQuery.data ?? { open: 0, scheduled: 0, overdue: 0, completed: 0 },
    labels: labelsQuery.data ?? [],
    selected: tasks.find((t) => t.id === selectedId) ?? null,
    selectedId,
    select: (id: string | null) => setSelectedId(id),
    // filter state
    status,
    setStatus,
    priority,
    setPriority,
    labelId,
    setLabelId,
    sort,
    setSort,
    text,
    setText,
    // mutations
    create: (input: {
      title: string;
      priority?: TaskPriority;
      dueAt?: string | null;
      estimatedMinutes?: number | null;
    }) => createM.mutate(input),
    update: (input: Parameters<typeof updateM.mutate>[0]) => updateM.mutate(input),
    complete: (id: string) => completeM.mutate({ id }),
    archive: (id: string) => archiveM.mutate({ id }),
    remove: (id: string) => deleteM.mutate({ id }),
    schedule: (id: string) => scheduleM.mutate({ id }),
    addDependency: (taskId: string, dependsOnTaskId: string) =>
      addDepM.mutate({ taskId, dependsOnTaskId }),
    removeDependency: (taskId: string, dependsOnTaskId: string) =>
      removeDepM.mutate({ taskId, dependsOnTaskId }),
    setRecurrence: (taskId: string, frequency: RecurrenceFrequency, interval: number) =>
      recurringM.mutate({ taskId, frequency, interval }),
    pending:
      createM.isPending ||
      updateM.isPending ||
      completeM.isPending ||
      archiveM.isPending ||
      deleteM.isPending ||
      scheduleM.isPending,
  };
}
