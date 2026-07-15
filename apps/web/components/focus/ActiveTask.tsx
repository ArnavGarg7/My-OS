"use client";

import { FolderKanban, ListChecks } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import type { FocusSession } from "@myos/core/focus";
import { SESSION_TYPE_ICON } from "./focus-icons";

/**
 * ActiveTask (Sprint 3.2). Shows what the current session is anchored to — its task,
 * planner block and project. Focus references these entities; it never owns them, so
 * we show only lightweight identifiers passed alongside the session.
 */
export function ActiveTask({
  session,
  taskTitle,
  projectTitle,
}: {
  session: FocusSession;
  taskTitle?: string | null;
  projectTitle?: string | null;
}) {
  const Icon = SESSION_TYPE_ICON[session.type];
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="inline-flex items-center gap-1.5">
        <Icon size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">{taskTitle ?? "Untitled focus"}</Text>
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {projectTitle ? (
          <Badge size="sm" variant="neutral">
            <FolderKanban size={11} aria-hidden /> {projectTitle}
          </Badge>
        ) : null}
        {session.plannerBlockId ? (
          <Badge size="sm" variant="accent">
            <ListChecks size={11} aria-hidden /> Planner block
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
