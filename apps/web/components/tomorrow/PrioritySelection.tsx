"use client";

import { Badge, Text, cn } from "@myos/ui";
import type { RankedPriority } from "@myos/core/tomorrow";

/**
 * PrioritySelection (Sprint 3.1). Step 3 — deterministically ranked candidates.
 * The user picks up to five; the top three are highlighted.
 */
export function PrioritySelection({
  ranked,
  chosen,
  onToggle,
}: {
  ranked: RankedPriority[];
  chosen: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (ranked.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No open work to prioritise — enjoy the clear runway.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="subtle">
        {chosen.size}/5 selected · top 3 recommended
      </Text>
      {ranked.map((p) => {
        const selected = chosen.has(p.id);
        const recommended = p.rank <= 3;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(p.id)}
            className={cn(
              "border-border flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors",
              selected ? "border-accent bg-accent/10" : "hover:bg-elevated",
            )}
          >
            <span
              className={cn(
                "text-caption flex size-6 shrink-0 items-center justify-center rounded-full font-medium",
                selected ? "bg-accent text-on-accent" : "bg-elevated text-fg-subtle",
              )}
            >
              {p.rank}
            </span>
            <Text variant="body-s" className="min-w-0 flex-1 truncate">
              {p.title}
            </Text>
            {recommended ? (
              <Badge size="sm" variant="accent">
                Top
              </Badge>
            ) : null}
            <Text variant="caption" tone="subtle" className="tabular-nums">
              {p.score}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
