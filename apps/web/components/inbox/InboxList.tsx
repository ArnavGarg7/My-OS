"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { EmptyState } from "@myos/ui";
import type { InboxItem } from "@myos/core/inbox";
import { InboxRow } from "./InboxRow";

/**
 * The editorial inbox list (Sprint 2.4). A flat, scannable list of rows — no
 * cards, no columns. Selecting a row opens it in the context panel.
 */
export function InboxList({
  items,
  selectedId,
  onSelect,
  emptyLabel,
}: {
  items: InboxItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="p-10">
        <EmptyState
          icon={InboxIcon}
          title="Nothing here"
          description={emptyLabel ?? "Captured items will appear here. Your inbox is clear."}
        />
      </div>
    );
  }

  return (
    <div role="list" className="flex flex-col">
      {items.map((item) => (
        <InboxRow
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}
