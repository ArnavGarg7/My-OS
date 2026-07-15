import type { WorkoutSection as WorkoutData } from "@myos/core/morning";

/** 9. Workout — placeholder. */
export function WorkoutSection({ data }: { data: WorkoutData }) {
  if (!data.planned) {
    return <p className="text-body-m text-fg-muted">{data.message ?? "No workout planned."}</p>;
  }
  return (
    <div className="text-body-m flex items-baseline gap-3">
      <span className="text-fg font-medium">{data.title}</span>
      {data.detail ? <span className="text-fg-muted">{data.detail}</span> : null}
      {data.time ? <span className="text-fg-subtle ml-auto font-mono">{data.time}</span> : null}
    </div>
  );
}
