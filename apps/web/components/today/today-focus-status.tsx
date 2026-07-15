"use client";

import { selectCurrentFocusLabel } from "@myos/core/today";
import { trpc } from "@/lib/trpc/client";

/**
 * "Current Focus" status-bar indicator (Sprint 2.1). Renders the day's current
 * activity / mission compactly, or nothing when there's no focus set.
 */
export function TodayFocusStatus() {
  const focus = trpc.today.getFocus.useQuery({});
  const state = trpc.today.getState.useQuery({});

  const label = selectCurrentFocusLabel(focus.data ?? null, state.data ?? null);
  if (!label) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-fg-subtle">Focus</span>
      <span className="text-fg-muted max-w-[160px] truncate font-medium">{label}</span>
    </div>
  );
}
