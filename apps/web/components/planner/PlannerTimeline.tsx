"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@myos/ui";
import type { PlannerBlock, PlannerBlockType } from "@myos/core/planner";
import { TimelineHour } from "./TimelineHour";
import { PlannerNowIndicator } from "./PlannerNowIndicator";

/**
 * The editorial vertical timeline (Sprint 2.6). Hour rows top-to-bottom with the
 * blocks that start in each hour. No calendar grid, no kanban. Overflow blocks
 * are listed after the working window.
 */
export function PlannerTimeline({
  blocks,
  selectedId,
  visibleTypes,
  onSelect,
}: {
  blocks: PlannerBlock[];
  selectedId: string | null;
  visibleTypes: Set<PlannerBlockType> | null;
  onSelect: (id: string) => void;
}) {
  const visible = useMemo(
    () => (visibleTypes ? blocks.filter((b) => visibleTypes.has(b.type)) : blocks),
    [blocks, visibleTypes],
  );

  const { hours, overflow } = useMemo(() => {
    const timed = visible.filter((b) => b.type !== "overflow");
    const overflowBlocks = visible.filter((b) => b.type === "overflow");
    if (timed.length === 0)
      return { hours: [] as { hour: number; blocks: PlannerBlock[] }[], overflow: overflowBlocks };
    const startHours = timed.map((b) => new Date(b.startTime).getHours());
    const min = Math.min(...startHours);
    const max = Math.max(...startHours);
    const grouped: { hour: number; blocks: PlannerBlock[] }[] = [];
    for (let h = min; h <= max; h++) {
      grouped.push({
        hour: h,
        blocks: timed
          .filter((b) => new Date(b.startTime).getHours() === h)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      });
    }
    return { hours: grouped, overflow: overflowBlocks };
  }, [visible]);

  if (visible.length === 0) {
    return (
      <div className="p-10">
        <EmptyState
          icon={CalendarClock}
          title="No plan yet"
          description="Generate a plan to turn today's tasks into a timeline."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-4">
      <PlannerNowIndicator />
      {hours.map((row) => (
        <TimelineHour
          key={row.hour}
          hour={row.hour}
          blocks={row.blocks}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
      {overflow.length > 0 ? (
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="text-label text-danger px-1">After hours (overflow)</div>
          {overflow.map((b) => (
            <div key={b.id} className="pl-14">
              <TimelineHour
                hour={new Date(b.startTime).getHours()}
                blocks={[b]}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
