"use client";

import { useState } from "react";
import { Button, EmptyState, Input, Text } from "@myos/ui";
import { Network } from "lucide-react";
import type { WikiPage } from "@myos/core/knowledge";
import { Tags } from "./Tags";

/**
 * WikiExplorer (Sprint 4.1). Lists wiki pages (uniquely identified by title) and lets
 * you create a new one. Selecting a page opens it with backlinks + references.
 */
export function WikiExplorer({
  pages,
  selectedId,
  onSelect,
  onCreate,
}: {
  pages: WikiPage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (input: { title: string; content?: string }) => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New wiki page title…"
          aria-label="Wiki title"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!title.trim()) return;
            onCreate({ title: title.trim() });
            setTitle("");
          }}
        >
          Create
        </Button>
      </div>
      {pages.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No wiki pages"
          description="Create a page and link it with [[double brackets]]."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={`w-full rounded-md border px-3 py-2 text-left ${
                  p.id === selectedId
                    ? "border-accent bg-surface-raised"
                    : "border-border-subtle hover:bg-surface-raised"
                }`}
              >
                <Text variant="body-s">{p.title}</Text>
                <Tags tags={p.tags} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
