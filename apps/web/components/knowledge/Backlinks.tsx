"use client";

import { Badge, Text } from "@myos/ui";
import type { BacklinkView } from "@myos/core/knowledge";
import { TYPE_ICON, TYPE_LABEL } from "./knowledge-icons";

/**
 * Backlinks (Sprint 4.1). Shows the pages that link TO the selected entity — the wiki's
 * incoming links — plus any unresolved (red) links it points at.
 */
export function Backlinks({ view }: { view: BacklinkView }) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Backlinks
      </Text>
      {view.backlinks.length === 0 ? (
        <Text variant="caption" tone="subtle">
          {view.orphan ? "Orphan — no links in or out." : "No backlinks yet."}
        </Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {view.backlinks.map((b) => {
            const Icon = TYPE_ICON[b.fromType];
            return (
              <li key={b.fromId} className="flex items-center gap-1.5">
                <Icon size={12} aria-hidden className="text-fg-subtle" />
                <Text variant="caption">{b.fromTitle}</Text>
                <Badge size="sm" variant="neutral">
                  {TYPE_LABEL[b.fromType]}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
      {view.unresolved.length > 0 ? (
        <Text variant="caption" tone="subtle">
          Unresolved: {view.unresolved.join(", ")}
        </Text>
      ) : null}
    </div>
  );
}
