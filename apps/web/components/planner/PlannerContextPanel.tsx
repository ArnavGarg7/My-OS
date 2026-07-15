"use client";

import { useEffect, useState } from "react";
import { Text } from "@myos/ui";
import { currentBlock, remainingWork, upcomingBlock } from "@myos/core/planner";
import { usePlanner } from "./use-planner";
import { PlannerInspector } from "./PlannerInspector";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-label text-fg-subtle">{label}</span>
      <span className="text-body-s text-fg-muted truncate text-right">{value}</span>
    </div>
  );
}

/**
 * Planner context panel (Sprint 2.6). Shows the selected block's inspector when
 * one is selected; otherwise a live day summary (current block, remaining work,
 * upcoming, conflicts, utilization, free time, focus window).
 */
export function PlannerContextPanel() {
  const planner = usePlanner();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (planner.selected) {
    return (
      <div className="p-4">
        <PlannerInspector
          block={planner.selected}
          onLock={() => planner.lock(planner.selected!.id)}
          onUnlock={() => planner.unlock(planner.selected!.id)}
          onMove={(dir) => planner.move(planner.selected!.id, dir)}
          pending={planner.pending}
        />
      </div>
    );
  }

  const current = currentBlock(planner.blocks, now);
  const upcoming = upcomingBlock(planner.blocks, now);
  const util = planner.utilization;
  const day = planner.day;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Row label="Current block" value={current?.title ?? "None right now"} />
      <Row
        label="Upcoming"
        value={upcoming ? `${upcoming.title} · ${time(upcoming.startTime)}` : "—"}
      />
      <Row label="Remaining work" value={`${remainingWork(planner.blocks, now)} min`} />
      <Row label="Conflicts" value={String(planner.conflicts.length)} />
      <Row label="Utilization" value={`${util?.percentUtilized ?? 0}%`} />
      <Row label="Free time" value={`${util?.freeMinutes ?? 0} min`} />
      <Row
        label="Focus window"
        value={
          day?.focusWindowStart && day?.focusWindowEnd
            ? `${day.focusWindowStart}–${day.focusWindowEnd}`
            : "—"
        }
      />
      {planner.blocks.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          Generate a plan to see your day.
        </Text>
      ) : null}
    </div>
  );
}
