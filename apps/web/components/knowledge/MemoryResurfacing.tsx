"use client";

import { Badge, EmptyState, Text } from "@myos/ui";
import { Sparkles } from "lucide-react";
import type { ResurfacedItem } from "@myos/core/knowledge";
import { TYPE_ICON, TYPE_LABEL } from "./knowledge-icons";

const REASON_LABEL: Record<string, string> = {
  forgotten_knowledge: "Forgotten",
  stale_research: "Stale research",
  important_wiki: "Important wiki",
  unopened_book: "Unopened book",
  recently_linked: "Recently linked",
  interesting_note: "Worth revisiting",
};

/**
 * MemoryResurfacing (Sprint 4.1). The morning "resurface" panel — deterministically
 * ranked knowledge worth revisiting (forgotten notes, stale research, unopened books,
 * important wiki pages). Pure ranking; no embeddings.
 */
export function MemoryResurfacing({ items }: { items: ResurfacedItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nothing to resurface"
        description="Your knowledge is fresh — keep reading and linking."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => {
        const Icon = TYPE_ICON[item.type];
        return (
          <li
            key={item.id}
            className="border-border-subtle flex items-center justify-between gap-2 rounded-md border px-3 py-2"
          >
            <span className="flex items-center gap-2">
              <Icon size={13} aria-hidden className="text-fg-subtle" />
              <span className="flex flex-col">
                <Text variant="body-s">{item.title}</Text>
                <Text variant="caption" tone="subtle">
                  {TYPE_LABEL[item.type]} · {item.detail}
                </Text>
              </span>
            </span>
            <Badge size="sm" variant="warning">
              {REASON_LABEL[item.reason] ?? item.reason}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
