"use client";

import { useState } from "react";
import { Button, Input, Text, Textarea } from "@myos/ui";

/**
 * NoteEditor (Sprint 4.1). A minimal markdown editor reusing the design system — a title
 * field + a markdown textarea. No custom rich editor; wiki links + tags are parsed
 * deterministically on save by the engine.
 */
export function NoteEditor({
  onCreate,
  pending,
}: {
  onCreate: (input: { title?: string; content?: string }) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submit = () => {
    if (!title.trim() && !content.trim()) return;
    onCreate({ ...(title.trim() ? { title: title.trim() } : {}), content });
    setTitle("");
    setContent("");
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        aria-label="Note title"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write markdown… use [[Wiki Links]] and #tags"
        rows={8}
        aria-label="Note content"
      />
      <div className="flex items-center justify-between">
        <Text variant="caption" tone="subtle">
          Supports headings, code, lists, [[links]] and #tags.
        </Text>
        <Button size="sm" variant="primary" onClick={submit} disabled={pending}>
          Create note
        </Button>
      </div>
    </div>
  );
}
