"use client";

import { CalendarClock, CheckCircle2, Archive, Trash2 } from "lucide-react";
import { formatDate } from "@myos/shared/format";
import { Button, Text, Progress } from "@myos/ui";
import { calculateProgress, type TaskDependency } from "@myos/core/task";
import { useTask } from "./use-task";
import { TaskEditor } from "./TaskEditor";
import { TaskStatus } from "./TaskStatus";
import { TaskDependencies } from "./TaskDependencies";
import { TaskRecurrence } from "./TaskRecurrence";
import { TaskTimeline } from "./TaskTimeline";
import { TaskProjectPicker } from "./TaskProjectPicker";

/**
 * Task context panel (Sprint 2.5). The right-hand detail view for the selected
 * task: inline editor, schedule, dependencies, recurrence, progress and history.
 */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <Text variant="label" tone="subtle">
        {label}
      </Text>
      {children}
    </section>
  );
}

export function TaskContextPanel() {
  const t = useTask();
  const task = t.selected;

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <Text variant="body-s" tone="subtle">
          Select a task to edit its details, dependencies and schedule.
        </Text>
      </div>
    );
  }

  const deps: TaskDependency[] = task.dependencies.map((id) => ({
    taskId: task.id,
    dependsOnTaskId: id,
  }));
  const progress = calculateProgress(task, deps, t.tasks, new Date());

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-2">
        <TaskStatus status={task.status} />
        {progress.isBlocked ? (
          <Text variant="caption" tone="subtle">
            Blocked by {progress.blockedBy.length}
          </Text>
        ) : null}
      </div>

      <TaskEditor
        key={task.id}
        task={task}
        onUpdate={(patch) => t.update({ id: task.id, ...patch })}
      />

      <Section label="Progress">
        <Progress value={progress.completionPercent} />
        <Text variant="caption" tone="subtle">
          {progress.completionPercent}% ·{" "}
          {progress.remainingMinutes === null
            ? "no estimate"
            : `${progress.remainingMinutes} min left`}
          {progress.isLate ? " · overdue" : ""}
        </Text>
      </Section>

      <Section label="Schedule">
        {task.scheduledStart ? (
          <Text variant="body-s" tone="muted">
            {formatDate(task.scheduledStart)}
            {task.scheduledEnd
              ? ` → ${new Date(task.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </Text>
        ) : (
          <Text variant="body-s" tone="subtle">
            Not scheduled.
          </Text>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => t.schedule(task.id)}
          loading={t.pending}
          leftIcon={<CalendarClock size={14} aria-hidden />}
        >
          Recommend a slot
        </Button>
      </Section>

      <Section label="Project">
        <TaskProjectPicker task={task} />
      </Section>

      <Section label="Dependencies">
        <TaskDependencies
          task={task}
          allTasks={t.tasks}
          onAdd={(dep) => t.addDependency(task.id, dep)}
          onRemove={(dep) => t.removeDependency(task.id, dep)}
        />
      </Section>

      <Section label="Recurrence">
        <TaskRecurrence onSet={(f, i) => t.setRecurrence(task.id, f, i)} pending={t.pending} />
      </Section>

      <Section label="History">
        <TaskTimeline task={task} />
      </Section>

      <div className="flex flex-wrap gap-2">
        {task.status !== "completed" ? (
          <Button
            size="sm"
            onClick={() => t.complete(task.id)}
            loading={t.pending}
            leftIcon={<CheckCircle2 size={14} aria-hidden />}
          >
            Complete
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => t.archive(task.id)}
          disabled={t.pending}
          leftIcon={<Archive size={14} aria-hidden />}
        >
          Archive
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => t.remove(task.id)}
          disabled={t.pending}
          leftIcon={<Trash2 size={14} aria-hidden />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
