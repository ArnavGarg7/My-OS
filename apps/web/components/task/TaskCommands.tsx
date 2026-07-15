"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  Copy,
  GitBranch,
  Link2Off,
  ListChecks,
  Plus,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import { Button, Input } from "@myos/ui";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useTask } from "./use-task";
import { usePlanner } from "@/components/planner/use-planner";

/** Modal body for creating a task from the command center. */
function CreateTaskForm({
  onCreate,
  close,
}: {
  onCreate: (title: string) => void;
  close: () => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            onCreate(title.trim());
            close();
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          disabled={!title.trim()}
          onClick={() => {
            onCreate(title.trim());
            close();
          }}
        >
          Create task
        </Button>
      </div>
    </div>
  );
}

/** Task command group (Sprint 2.5). Registration only. Mount once in shell. */
export function TaskCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const { open } = useModal();
  const t = useTask();
  const planner = usePlanner();
  const selectedInboxId = useShellStore((s) => s.selectedInboxId);
  const utils = trpc.useUtils();

  const convertM = trpc.task.convertInbox.useMutation({
    onSuccess: (task) => {
      utils.task.list.invalidate();
      utils.inbox.list.invalidate();
      t.select(task.id);
      toaster.success("Converted to task", task.title);
    },
    onError: (e) => toaster.error("Couldn't convert", e.message),
  });

  const groups = useMemo<CommandGroup[]>(() => {
    const need = () => toaster.info("Select a task first.");
    const withSelected = (fn: (id: string) => void) => () =>
      t.selected ? fn(t.selected.id) : need();

    const pickDependency = () => {
      if (!t.selected) return need();
      const current = t.selected;
      const candidates = t.tasks.filter(
        (x) =>
          x.id !== current.id && !current.dependencies.includes(x.id) && x.status !== "archived",
      );
      open(
        (close) => (
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto pt-2">
            {candidates.length === 0 ? (
              <p className="text-body-s text-fg-subtle">No eligible tasks.</p>
            ) : (
              candidates.map((c) => (
                <Button
                  key={c.id}
                  variant="secondary"
                  className="justify-start"
                  onClick={() => {
                    t.addDependency(current.id, c.id);
                    close();
                  }}
                >
                  {c.title}
                </Button>
              ))
            )}
          </div>
        ),
        { title: "Add dependency", size: "sm" },
      );
    };

    const removeDependency = () => {
      if (!t.selected || t.selected.dependencies.length === 0)
        return toaster.info("No dependencies.");
      const current = t.selected;
      const byId = new Map(t.tasks.map((x) => [x.id, x]));
      open(
        (close) => (
          <div className="flex flex-col gap-1 pt-2">
            {current.dependencies.map((id) => (
              <Button
                key={id}
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  t.removeDependency(current.id, id);
                  close();
                }}
              >
                {byId.get(id)?.title ?? id}
              </Button>
            ))}
          </div>
        ),
        { title: "Remove dependency", size: "sm" },
      );
    };

    return [
      {
        id: "task",
        title: "Task",
        category: "task",
        priority: 95,
        commands: [
          {
            id: "task:create",
            title: "Create Task",
            category: "task",
            icon: Plus,
            keywords: ["task", "new", "create", "add"],
            execute: (ctx) => {
              ctx.close();
              open(
                (close) => (
                  <CreateTaskForm onCreate={(title) => t.create({ title })} close={close} />
                ),
                {
                  title: "Create task",
                  size: "sm",
                },
              );
            },
          },
          {
            id: "task:complete",
            title: "Complete Task",
            category: "task",
            icon: CheckCircle2,
            keywords: ["task", "done", "complete"],
            execute: (ctx) => {
              ctx.close();
              withSelected((id) => t.complete(id))();
            },
          },
          {
            id: "task:schedule",
            title: "Schedule Task",
            category: "task",
            icon: CalendarClock,
            keywords: ["task", "schedule", "slot"],
            execute: (ctx) => {
              ctx.close();
              withSelected((id) => t.schedule(id))();
            },
          },
          {
            id: "task:duplicate",
            title: "Duplicate Task",
            category: "task",
            icon: Copy,
            keywords: ["task", "duplicate", "copy"],
            execute: (ctx) => {
              ctx.close();
              if (!t.selected) return need();
              t.create({
                title: `${t.selected.title} (copy)`,
                priority: t.selected.priority,
                estimatedMinutes: t.selected.estimatedMinutes,
                dueAt: t.selected.dueAt,
              });
            },
          },
          {
            id: "task:archive",
            title: "Archive Task",
            category: "task",
            icon: Archive,
            keywords: ["task", "archive"],
            execute: (ctx) => {
              ctx.close();
              withSelected((id) => t.archive(id))();
            },
          },
          {
            id: "task:delete",
            title: "Delete Task",
            category: "task",
            icon: Trash2,
            keywords: ["task", "delete", "remove"],
            execute: (ctx) => {
              ctx.close();
              withSelected((id) => t.remove(id))();
            },
          },
          {
            id: "task:convert-inbox",
            title: "Convert Inbox Item",
            category: "task",
            icon: ArrowRightLeft,
            keywords: ["convert", "inbox", "task"],
            execute: (ctx) => {
              ctx.close();
              if (selectedInboxId) convertM.mutate({ inboxId: selectedInboxId });
              else {
                toaster.info("Select an inbox item first.");
                router.push("/inbox");
              }
            },
          },
          {
            id: "task:add-dependency",
            title: "Add Dependency",
            category: "task",
            icon: GitBranch,
            keywords: ["dependency", "depends", "blocker"],
            execute: (ctx) => {
              ctx.close();
              pickDependency();
            },
          },
          {
            id: "task:remove-dependency",
            title: "Remove Dependency",
            category: "task",
            icon: Link2Off,
            keywords: ["dependency", "remove", "unblock"],
            execute: (ctx) => {
              ctx.close();
              removeDependency();
            },
          },
          {
            id: "task:show-completed",
            title: "Show Completed Tasks",
            category: "task",
            icon: ListChecks,
            keywords: ["completed", "done", "history"],
            execute: (ctx) => {
              ctx.close();
              t.setStatus("completed");
              router.push("/tasks");
            },
          },
          {
            id: "task:plan-day",
            title: "Plan My Day",
            category: "task",
            icon: CalendarClock,
            keywords: ["plan", "schedule", "planner", "day"],
            execute: (ctx) => {
              ctx.close();
              planner.generate();
              router.push("/planner");
            },
          },
        ],
      },
    ];
  }, [router, toaster, open, t, planner, selectedInboxId, convertM, utils]);

  useRegisterGroups(groups);
  return null;
}
