"use client";

import { useState } from "react";
import { Button, Input, cn } from "@myos/ui";
import {
  ENTRY_TYPES,
  type CreateEntrySchemaInput,
  type EntryType,
  type MoodLevel,
} from "@myos/core/journal";
import { WritingWorkspace } from "./WritingWorkspace";
import { MoodTracker } from "./MoodTracker";
import { ENTRY_ICON, ENTRY_LABEL } from "./journal-icons";

/**
 * JournalEditor (Sprint 2.10). Compose a new entry — title, mood, long-form
 * content and #tags parsed from a tags input. Minimal formatting by design.
 */
export function JournalEditor({
  entryType: initialType = "daily",
  seed = "",
  onSave,
  onCancel,
}: {
  entryType?: EntryType;
  seed?: string;
  onSave: (input: CreateEntrySchemaInput) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(seed);
  const [entryType, setEntryType] = useState<EntryType>(initialType);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [tagsRaw, setTagsRaw] = useState("");

  const save = () => {
    if (!title.trim() && !content.trim()) return;
    const tags = tagsRaw
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim().toLowerCase())
      .filter(Boolean);
    onSave({ title: title.trim(), content, entryType, mood, tags });
    setTitle("");
    setContent("");
    setEntryType(initialType);
    setMood(null);
    setTagsRaw("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Entry type" className="flex flex-wrap gap-1.5">
        {ENTRY_TYPES.map((t) => {
          const Icon = ENTRY_ICON[t];
          const active = entryType === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={ENTRY_LABEL[t]}
              onClick={() => setEntryType(t)}
              className={cn(
                "text-caption inline-flex items-center gap-1 rounded-md border px-2.5 py-1",
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
              )}
            >
              <Icon size={13} aria-hidden />
              {ENTRY_LABEL[t]}
            </button>
          );
        })}
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)…"
        aria-label="Entry title"
      />
      <MoodTracker value={mood} onChange={setMood} />
      <WritingWorkspace value={content} onChange={setContent} />
      <Input
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
        placeholder="#tags"
        aria-label="Tags"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={!title.trim() && !content.trim()} onClick={save}>
          Save entry
        </Button>
      </div>
    </div>
  );
}
