"use client";

import { Textarea, Text } from "@myos/ui";
import { writingStats } from "@myos/core/journal";

/**
 * WritingWorkspace (Sprint 2.10). A distraction-light long-form textarea with a
 * live word / reading-time readout (pure stats from the engine).
 */
export function WritingWorkspace({
  value,
  onChange,
  placeholder = "Write freely…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const stats = writingStats(value);
  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={10}
        className="resize-y"
      />
      <Text variant="caption" tone="subtle" className="tabular-nums">
        {stats.words} words · {stats.readingMinutes} min read
      </Text>
    </div>
  );
}
