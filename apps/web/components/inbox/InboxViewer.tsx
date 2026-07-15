"use client";

import { Archive, ListPlus, RotateCcw, Trash2 } from "lucide-react";
import { Button, Text } from "@myos/ui";
import type { InboxItem } from "@myos/core/inbox";
import { CAPTURE_ICON, captureLabel } from "./inbox-icons";

/**
 * Full capture viewer (Sprint 2.4; convert-to-task added in 2.5). Title + full
 * content + lifecycle actions. Reused by the context panel.
 */
export function InboxViewer({
  item,
  onArchive,
  onDelete,
  onRestore,
  onConvert,
  converted,
  pending,
}: {
  item: InboxItem;
  onArchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onConvert?: () => void;
  converted?: boolean;
  pending: boolean;
}) {
  const Icon = CAPTURE_ICON[item.type];
  const archived = item.status === "archived" || item.status === "deleted";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span className="text-fg-muted mt-1 shrink-0">
          <Icon size={16} aria-hidden />
        </span>
        <div className="min-w-0">
          <Text variant="heading-s">{item.title}</Text>
          <Text variant="caption" tone="subtle">
            {captureLabel(item.type)}
          </Text>
        </div>
      </div>

      {item.content ? (
        <p className="text-body-s text-fg-muted whitespace-pre-wrap break-words">{item.content}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {onConvert && !archived ? (
          <Button
            size="sm"
            onClick={onConvert}
            disabled={pending || converted}
            leftIcon={<ListPlus size={14} aria-hidden />}
          >
            {converted ? "Task created" : "Create Task"}
          </Button>
        ) : null}
        {archived ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={onRestore}
            disabled={pending}
            leftIcon={<RotateCcw size={14} aria-hidden />}
          >
            Restore
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={onArchive}
            disabled={pending}
            leftIcon={<Archive size={14} aria-hidden />}
          >
            Archive
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={pending}
          leftIcon={<Trash2 size={14} aria-hidden />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
