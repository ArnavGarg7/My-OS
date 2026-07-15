"use client";

import { useState } from "react";
import { Button, Input } from "@myos/ui";
import type { CreateEntrySchemaInput, EntryType, MoodLevel } from "@myos/core/journal";
import { WritingWorkspace } from "./WritingWorkspace";
import { MoodTracker } from "./MoodTracker";

/**
 * JournalEditor (Sprint 2.10). Compose a new entry — title, mood, long-form
 * content and #tags parsed from a tags input. Minimal formatting by design.
 */
export function JournalEditor({
  entryType = "daily",
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
    setMood(null);
    setTagsRaw("");
  };

  return (
    <div className="flex flex-col gap-3">
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
