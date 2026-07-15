import { formatDuration } from "@myos/shared/format";
import type { SleepSection as SleepData } from "@myos/core/morning";

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-caption text-fg-subtle">{label}</div>
      <div className="text-body-m text-fg font-mono tabular-nums">{value}</div>
    </div>
  );
}

/** 2. Sleep Summary — read-only, with elegant placeholders when unavailable. */
export function SleepSection({ data }: { data: SleepData }) {
  const duration =
    data.durationMinutes != null
      ? formatDuration(data.durationMinutes, { unit: "minutes", style: "short" })
      : "—";
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3">
      <Item label="Sleep target" value={data.sleepTarget ?? "Not set"} />
      <Item label="Wake time" value={data.wakeTime ?? "Not logged"} />
      <Item label="Duration" value={duration} />
      <Item label="Quality" value={data.quality ?? "—"} />
    </div>
  );
}
