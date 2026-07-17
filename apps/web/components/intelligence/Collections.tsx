"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import { collectionSize, type Collection } from "@myos/core/intelligence";
import { DashboardIcon } from "./intelligence-icons";

/**
 * Collections (Sprint 4.4). User-defined groupings — "Semester", "Fitness" — that reference
 * existing entities rather than copying them. This surface manages the groupings; the members
 * are the live entities in their own modules.
 */
export function Collections({
  collections,
  onCreate,
  onDelete,
}: {
  collections: Collection[];
  onCreate: (input: { name: string }) => void;
  onDelete: (input: { id: string }) => void;
}) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim() });
    setName("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Collection name"
          placeholder="New collection…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-52"
        />
        <Button size="sm" onClick={submit} disabled={!name.trim()}>
          Add
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={DashboardIcon}
          title="No collections yet"
          description="Group goals, tasks and notes into a focused view — Semester, Fitness, Masters."
        />
      ) : (
        <div className="flex flex-col gap-1">
          {collections.map((c) => (
            <div
              key={c.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">{c.name}</Text>
                <Text variant="caption" tone="subtle">
                  {collectionSize(c)} item{collectionSize(c) === 1 ? "" : "s"}
                </Text>
              </span>
              <span className="inline-flex items-center gap-2">
                <Badge size="sm" variant="neutral">
                  {collectionSize(c)}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => onDelete({ id: c.id })}>
                  Delete
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
