"use client";

import { useState, type ComponentType } from "react";
import { FileText, Lightbulb, NotebookPen, Target } from "lucide-react";
import { Button, Textarea, cn } from "@myos/ui";
import type { NoteType } from "@myos/core/today";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/**
 * Quick Add content for Today (Sprint 2.1). Captures a Today's Note, Quick
 * Thought, or Focus Block into the day via today.addNote. Nothing else.
 */
const OPTIONS: {
  type: NoteType;
  label: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}[] = [
  { type: "note", label: "Morning Note", icon: FileText },
  { type: "reflection", label: "Morning Reflection", icon: NotebookPen },
  { type: "idea", label: "Morning Idea", icon: Lightbulb },
  { type: "note", label: "Decision Note", icon: Target },
];

export function QuickAddToday() {
  const setOpen = useShellStore((s) => s.setQuickAddOpen);
  const toaster = useToaster();
  const utils = trpc.useUtils();

  const [type, setType] = useState<NoteType>("note");
  const [content, setContent] = useState("");

  const addNote = trpc.today.addNote.useMutation({
    onSuccess: () => {
      utils.today.listNotes.invalidate();
      toaster.success("Added to Today");
      setContent("");
      setOpen(false);
    },
    onError: (e) => toaster.error("Couldn’t add", e.message),
  });

  const submit = () => {
    const trimmed = content.trim();
    if (trimmed) addNote.mutate({ content: trimmed, type });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = type === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => setType(option.type)}
              aria-pressed={selected}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border px-3 py-2.5 outline-none transition-colors",
                selected
                  ? "border-accent bg-accent-muted/40 text-accent"
                  : "border-border text-fg-muted hover:bg-elevated",
              )}
            >
              <Icon size={16} aria-hidden />
              <span className="text-body-s">{option.label}</span>
            </button>
          );
        })}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Capture it…"
        rows={3}
        autoFocus
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
      />

      <div className="flex justify-end">
        <Button onClick={submit} loading={addNote.isPending} disabled={!content.trim()}>
          Add to Today
        </Button>
      </div>
    </div>
  );
}
