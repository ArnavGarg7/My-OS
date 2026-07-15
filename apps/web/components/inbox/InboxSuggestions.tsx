"use client";

import { ArrowRight, ListPlus } from "lucide-react";
import { Button, Spinner, cn } from "@myos/ui";
import type { Destination } from "@myos/core/inbox";
import { trpc } from "@/lib/trpc/client";

/**
 * Destination suggestions (Sprint 2.4). Deterministic, suggestions only —
 * choosing one *records* the destination (organize); nothing moves elsewhere.
 */
export function InboxSuggestions({
  itemId,
  onOrganize,
  onConvert,
  converted,
  pending,
}: {
  itemId: string;
  onOrganize: (destination: Destination) => void;
  onConvert?: () => void;
  converted?: boolean;
  pending: boolean;
}) {
  const suggestions = trpc.inbox.suggestDestination.useQuery({ id: itemId });

  if (suggestions.isLoading) return <Spinner size="sm" />;
  const all = suggestions.data ?? [];
  const top = all.slice(0, 4);
  if (top.length === 0) return null;
  const topConfidence = all[0]?.confidence ?? 0;

  return (
    <div className="flex flex-col gap-1.5">
      {onConvert ? (
        <Button
          size="sm"
          className="justify-between"
          onClick={onConvert}
          disabled={pending || converted}
          leftIcon={<ListPlus size={14} aria-hidden />}
        >
          <span>{converted ? "Task created" : "Create Task"}</span>
          <span className="tabular-nums opacity-80">{topConfidence}%</span>
        </Button>
      ) : null}
      {top.map((s) => (
        <button
          key={s.destination}
          type="button"
          disabled={pending}
          onClick={() => onOrganize(s.destination)}
          className={cn(
            "border-border group flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left outline-none transition-colors",
            "hover:border-accent hover:bg-accent-muted/30 focus-visible:border-accent disabled:opacity-50",
          )}
        >
          <span className="min-w-0">
            <span className="text-body-s text-fg block font-medium">{s.destination}</span>
            <span className="text-caption text-fg-subtle block truncate">{s.reason}</span>
          </span>
          <span className="text-fg-subtle flex shrink-0 items-center gap-2 tabular-nums">
            {s.confidence}%
            <ArrowRight
              size={14}
              aria-hidden
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
          </span>
        </button>
      ))}
    </div>
  );
}
