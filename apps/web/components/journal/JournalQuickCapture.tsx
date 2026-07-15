"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";
import { parseCapture, type CreateEntrySchemaInput } from "@myos/core/journal";

/**
 * JournalQuickCapture (Sprint 2.10). One-line capture that parses #tags and a
 * /mood directive deterministically into a structured entry.
 */
export function JournalQuickCapture({
  onCapture,
}: {
  onCapture: (input: CreateEntrySchemaInput) => void;
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    const parsed = parseCapture(text);
    onCapture({
      title: parsed.title,
      content: parsed.content,
      entryType: parsed.entryType,
      mood: parsed.mood,
      tags: parsed.tags,
    });
    setText("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture a thought… #tag /mood good"
          aria-label="Quick journal capture"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button disabled={!text.trim()} onClick={submit}>
          <PenLine size={14} aria-hidden />
          Capture
        </Button>
      </div>
      <Text variant="caption" tone="subtle">
        Tip: add #tags and /mood good to structure your capture.
      </Text>
    </div>
  );
}
