"use client";

import { Text } from "@myos/ui";

/**
 * References (Sprint 4.1). The outgoing wiki-link targets a note/page points at — the
 * mirror of Backlinks. Resolved links open the target; unresolved ones are red links.
 */
export function References({ linkedTitles }: { linkedTitles: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        References
      </Text>
      {linkedTitles.length === 0 ? (
        <Text variant="caption" tone="subtle">
          No outgoing links.
        </Text>
      ) : (
        <div className="flex flex-wrap gap-1">
          {linkedTitles.map((t) => (
            <span
              key={t}
              className="border-border-subtle text-fg-muted rounded border px-1.5 py-0.5 text-xs"
            >
              [[{t}]]
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
