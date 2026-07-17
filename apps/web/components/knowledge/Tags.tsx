"use client";

import { Badge } from "@myos/ui";

/**
 * Tags (Sprint 4.1). A simple row of tag chips shared by notes, wiki pages and decks.
 */
export function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((t) => (
        <Badge key={t} size="sm" variant="neutral">
          #{t}
        </Badge>
      ))}
    </div>
  );
}
