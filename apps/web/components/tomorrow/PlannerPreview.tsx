"use client";

import { RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Button, EmptyState, Progress, Text } from "@myos/ui";
import type { PlannerPreview as Preview } from "@myos/core/tomorrow";
import { eventTime, minutesLabel } from "./tomorrow-icons";

/**
 * PlannerPreview (Sprint 3.1). Step 5 — a draft of tomorrow's timeline from the
 * canonical Planner engine. Preview only: Generate, Regenerate or Discard. It
 * never silently overwrites.
 */
export function PlannerPreview({
  preview,
  onGenerate,
  onDiscard,
  pending,
}: {
  preview: Preview | null;
  onGenerate: () => void;
  onDiscard: () => void;
  pending?: boolean;
}) {
  if (!preview || preview.blocks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState
          icon={Sparkles}
          title="Draft tomorrow's plan"
          description="Preview a deterministic timeline built by the Planner engine. Nothing is saved as canonical until you accept."
        />
        <Button onClick={onGenerate} loading={pending ?? false}>
          <Sparkles size={14} aria-hidden />
          Generate preview
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-s">
          {preview.blockCount} blocks · {minutesLabel(preview.totalMinutes)}
        </Text>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={onGenerate} loading={pending ?? false}>
            <RefreshCw size={13} aria-hidden />
            Regenerate
          </Button>
          <Button size="sm" variant="ghost" onClick={onDiscard}>
            <Trash2 size={13} aria-hidden />
            Discard
          </Button>
        </div>
      </div>
      <div>
        <Text variant="caption" tone="subtle">
          Utilisation {preview.utilization}%
        </Text>
        <Progress value={preview.utilization} />
      </div>
      <ul className="flex flex-col gap-1.5">
        {preview.blocks.map((b) => (
          <li
            key={b.id || b.start}
            className="border-border flex items-center gap-3 rounded-md border p-2.5"
          >
            <span className="text-fg-subtle text-caption w-24 shrink-0 tabular-nums">
              {eventTime(b.start)}–{eventTime(b.end)}
            </span>
            <Text variant="body-s" className="min-w-0 flex-1 truncate">
              {b.title}
            </Text>
            <Text variant="caption" tone="subtle">
              {minutesLabel(b.minutes)}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
