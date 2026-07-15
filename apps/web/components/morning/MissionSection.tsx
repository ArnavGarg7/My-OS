import type { MissionSection as MissionData } from "@myos/core/morning";

/** 4. Today's Mission — the biggest thing. Huge type, one sentence. Read-only. */
export function MissionSection({ data }: { data: MissionData }) {
  return (
    <div>
      <p className="text-fg text-2xl font-semibold leading-snug sm:text-3xl">
        {data.mission ?? "No mission set for today."}
      </p>
      {data.reason ? <p className="text-body-m text-fg-muted mt-3">{data.reason}</p> : null}
    </div>
  );
}
