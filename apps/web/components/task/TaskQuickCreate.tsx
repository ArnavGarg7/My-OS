"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input } from "@myos/ui";

/**
 * Inline task quick-create (Sprint 2.5). A single input at the top of the list —
 * no modal. Enter (or the button) creates a not-started task.
 */
export function TaskQuickCreate({
  onCreate,
  pending,
}: {
  onCreate: (title: string) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setTitle("");
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        aria-label="New task title"
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <Button
        onClick={submit}
        loading={pending}
        disabled={!title.trim()}
        leftIcon={<Plus size={15} aria-hidden />}
      >
        Add
      </Button>
    </div>
  );
}
