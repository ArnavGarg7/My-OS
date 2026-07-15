"use client";

import { formatRelativeTime } from "@myos/shared/format";
import { Badge, cn } from "@myos/ui";
import type { InboxItem } from "@myos/core/inbox";
import { CAPTURE_ICON } from "./inbox-icons";

/**
 * A single inbox row (Sprint 2.4) — Apple Mail style: icon · title · preview ·
 * date · status. No card, no kanban. Click selects (opens in the context panel).
 */
export function InboxRow({
  item,
  selected,
  onSelect,
}: {
  item: InboxItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = CAPTURE_ICON[item.type];
  const preview = item.content.replace(/\s+/g, " ").trim();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "border-border flex w-full items-start gap-3 border-b px-4 py-3 text-left outline-none transition-colors",
        selected ? "bg-accent-muted/40" : "hover:bg-elevated focus-visible:bg-elevated",
      )}
    >
      <span className="text-fg-muted mt-0.5 shrink-0">
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-body-m text-fg truncate font-medium">{item.title}</span>
          {item.status !== "new" ? (
            <Badge size="sm" variant="neutral">
              {item.status}
            </Badge>
          ) : null}
        </span>
        {preview ? <span className="text-body-s text-fg-muted line-clamp-1">{preview}</span> : null}
      </span>
      <span className="text-caption text-fg-subtle shrink-0 whitespace-nowrap tabular-nums">
        {formatRelativeTime(item.capturedAt)}
      </span>
    </button>
  );
}
