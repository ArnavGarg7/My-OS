"use client";

import { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@myos/ui";
import { SESSION_TYPES, type SessionType } from "@myos/core/focus";
import { SESSION_TYPE_ICON, SESSION_TYPE_LABEL } from "./focus-icons";

/**
 * StartPanel (Sprint 3.2; task-anchoring added in Stage 2). The idle state — pick
 * what you're working on, a session mode and a length, then begin. Anchoring a
 * session to a real task is the EXECUTE seam: the task moves to in_progress and
 * the focused time is credited back to it on completion. Presentational — the
 * open-task list is fetched by the workspace and passed in.
 * Meeting/break/recovery are excluded here (they are not user-started focus work).
 */
const STARTABLE = SESSION_TYPES.filter(
  (t) => t !== "meeting" && t !== "break" && t !== "recovery",
) as SessionType[];
const DURATIONS = [25, 50, 90];
const NO_TASK = "__none__";

export interface StartPanelTask {
  id: string;
  title: string;
}

export interface StartFocusInput {
  type: SessionType;
  minutes: number;
  taskId?: string;
}

export function StartPanel({
  onStart,
  pending,
  tasks = [],
}: {
  onStart: (input: StartFocusInput) => void;
  pending: boolean;
  /** Open tasks to anchor the session to (already ordered by priority). */
  tasks?: StartPanelTask[];
}) {
  const [type, setType] = useState<SessionType>("deep_work");
  const [minutes, setMinutes] = useState(50);
  const [taskId, setTaskId] = useState<string>(NO_TASK);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10 text-center">
      <div className="flex flex-col gap-1">
        <Text variant="heading-m">Ready to focus?</Text>
        <Text variant="body-s" tone="subtle">
          {tasks.length > 0
            ? "Anchor a task if you like, pick a mode and length, then start deep work."
            : "Pick a mode and length, then start deep work."}
        </Text>
      </div>

      {/* What are you working on? (optional — anchors the session to real work) */}
      {tasks.length > 0 ? (
        <div className="w-full">
          <Select value={taskId} onValueChange={setTaskId}>
            <SelectTrigger aria-label="Focus on a task" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TASK}>Just focus — no task</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2">
        {STARTABLE.map((t) => {
          const Icon = SESSION_TYPE_ICON[t];
          return (
            <Button
              key={t}
              size="sm"
              variant={type === t ? "primary" : "secondary"}
              onClick={() => setType(t)}
            >
              <Icon size={13} aria-hidden /> {SESSION_TYPE_LABEL[t]}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {DURATIONS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={minutes === d ? "subtle" : "ghost"}
            onClick={() => setMinutes(d)}
          >
            {d}m
          </Button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={() => onStart({ type, minutes, ...(taskId !== NO_TASK ? { taskId } : {}) })}
        disabled={pending}
      >
        Start {SESSION_TYPE_LABEL[type]}
      </Button>
    </div>
  );
}
