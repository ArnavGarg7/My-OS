import { formatDuration } from "@myos/shared/format";
import type { RemainingDaySection as RemainingData } from "@myos/core/morning";

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-caption text-fg-subtle">{label}</div>
      <div className={`text-body-m text-fg ${mono ? "font-mono tabular-nums" : "capitalize"}`}>
        {value}
      </div>
    </div>
  );
}

/** 7. Remaining Day — pure calculations from the planner. */
export function RemainingDaySection({ data }: { data: RemainingData }) {
  const remaining =
    data.remainingMinutes > 0
      ? formatDuration(data.remainingMinutes, { unit: "minutes", style: "short" })
      : "Day wrapped";
  const window = data.productiveWindow.active
    ? `${data.productiveWindow.start} – ${data.productiveWindow.end}`
    : "Outside hours";
  const checkpoint = data.nextCheckpoint
    ? `${data.nextCheckpoint.label} · ${data.nextCheckpoint.at}`
    : "—";

  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3">
      <Item label="Hours remaining" value={remaining} mono />
      <Item label="Current phase" value={data.phase} />
      <Item label="Next checkpoint" value={checkpoint} mono />
      <Item label="Productive window" value={window} mono />
    </div>
  );
}
