"use client";

import { useState, type ComponentType } from "react";
import { Button, Textarea, cn } from "@myos/ui";
import type { CaptureType } from "@myos/core/inbox";
import { useShellStore } from "@/lib/shell/store";
import { CAPTURE_ICON, captureLabel } from "./inbox-icons";
import { useInbox } from "./use-inbox";

/**
 * Quick Add (Sprint 2.4, rebuilt). Every capture lands in the Inbox as `new`.
 * The type row replaces the old hardcoded Today buttons. Nothing is categorized.
 */
const OPTIONS: { type: CaptureType; label: string }[] = [
  { type: "text", label: "Capture Text" },
  { type: "task", label: "Capture Task" },
  { type: "idea", label: "Capture Idea" },
  { type: "url", label: "Capture Link" },
  { type: "note", label: "Capture Note" },
  { type: "decision_note", label: "Capture Decision Note" },
  { type: "journal", label: "Capture Journal Thought" },
];

export function InboxQuickAdd() {
  const setOpen = useShellStore((s) => s.setQuickAddOpen);
  const preselect = useShellStore((s) => s.quickAddType);
  const inbox = useInbox();

  const initial = (OPTIONS.find((o) => o.type === preselect)?.type ?? "text") as CaptureType;
  const [type, setType] = useState<CaptureType>(initial);
  const [content, setContent] = useState("");

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    inbox.capture({ type, content: trimmed, source: "quick_add" });
    setContent("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left outline-none transition-colors",
                selected
                  ? "border-accent bg-accent-muted/40 text-accent"
                  : "border-border text-fg-muted hover:bg-elevated",
              )}
            >
              <Icon size={15} aria-hidden />
              <span className="text-body-s truncate">{captureLabel(option.type)}</span>
            </button>
          );
        })}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Capture anything — it lands in your inbox…"
        rows={3}
        autoFocus
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
      />

      <div className="flex justify-end">
        <Button onClick={submit} loading={inbox.capturePending} disabled={!content.trim()}>
          Capture to Inbox
        </Button>
      </div>
    </div>
  );
}
