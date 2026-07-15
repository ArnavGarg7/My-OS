import type { YesterdaySection as YesterdayData } from "@myos/core/morning";

function Item({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-caption text-fg-subtle">{label}</div>
      <div className="text-body-m text-fg font-mono tabular-nums">{value}</div>
    </div>
  );
}

/** 11. Yesterday — infrastructure only. */
export function YesterdaySection({ data }: { data: YesterdayData }) {
  if (!data.hasData) {
    return (
      <p className="text-body-m text-fg-muted">No history yet — this fills in as you use My OS.</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3">
      <Item label="Completed" value={data.completed} />
      <Item label="Incomplete" value={data.incomplete} />
      <Item label="Carried forward" value={data.carriedForward} />
    </div>
  );
}
