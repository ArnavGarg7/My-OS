"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Badge, Button, Kbd, MonoLabel, Textarea, cn } from "@myos/ui";
import type { CaptureType } from "@myos/core/inbox";
import { parseTask } from "@myos/core/task";
import { useShellStore } from "@/lib/shell/store";
import { CAPTURE_ICON, captureLabel } from "./inbox-icons";
import { useInbox } from "./use-inbox";

/**
 * Quick Add (Sprint 2.4, rebuilt; V2 polish). Every capture lands in the Inbox
 * as `new` — nothing is auto-categorised. Picking "Task" previews what the
 * deterministic parser reads from the text (date / duration / priority), so a
 * one-line capture is honest about what it becomes.
 */
const OPTIONS: { type: CaptureType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "task", label: "Task" },
  { type: "idea", label: "Idea" },
  { type: "url", label: "Link" },
  { type: "note", label: "Note" },
  { type: "decision_note", label: "Decision" },
  { type: "journal", label: "Journal" },
];

export function InboxQuickAdd() {
  const setOpen = useShellStore((s) => s.setQuickAddOpen);
  const preselect = useShellStore((s) => s.quickAddType);
  const inbox = useInbox();

  const initial = (OPTIONS.find((o) => o.type === preselect)?.type ?? "text") as CaptureType;
  const [type, setType] = useState<CaptureType>(initial);
  const [content, setContent] = useState("");

  const parsed = useMemo(
    () => (type === "task" && content.trim() ? parseTask(content, new Date()) : null),
    [type, content],
  );

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    inbox.capture({ type, content: trimmed, source: "quick_add" });
    setContent("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => {
          const Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }> =
            CAPTURE_ICON[option.type];
          const selected = type === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => setType(option.type)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left outline-none transition-colors",
                selected
                  ? "border-accent bg-accent-muted/40 text-accent"
                  : "border-border text-fg-muted hover:bg-elevated",
              )}
            >
              <Icon size={14} aria-hidden />
              <span className="text-body-s">{captureLabel(option.type)}</span>
            </button>
          );
        })}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          type === "task"
            ? "e.g. Draft the report tomorrow 2h urgent"
            : "Capture anything — it lands in your inbox…"
        }
        rows={3}
        autoFocus
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
      />

      {parsed && parsed.title !== "Untitled task" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <MonoLabel tone="subtle">Reads as</MonoLabel>
          <Badge variant="outline" size="sm">
            {parsed.title}
          </Badge>
          <Badge variant="neutral" size="sm" className="uppercase">
            {parsed.priority}
          </Badge>
          {parsed.dueAt ? (
            <Badge variant="outline" size="sm">
              due{" "}
              {new Date(parsed.dueAt).toLocaleDateString([], { month: "short", day: "numeric" })}
            </Badge>
          ) : null}
          {parsed.estimatedMinutes ? (
            <Badge variant="outline" size="sm">
              {parsed.estimatedMinutes}m
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-fg-subtle text-caption flex items-center gap-1">
          <Kbd size="sm">⌘</Kbd>
          <Kbd size="sm">↵</Kbd>
          to capture
        </span>
        <Button onClick={submit} loading={inbox.capturePending} disabled={!content.trim()}>
          Capture to Inbox
        </Button>
      </div>
    </div>
  );
}
