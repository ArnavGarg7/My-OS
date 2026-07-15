"use client";

import { useEffect, useState } from "react";
import { assembleMorningBriefing } from "@myos/core/morning";
import { selectWorkingHours } from "@myos/core/today";
import { useIdentity } from "@/lib/identity";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning context panel (Sprint 2.2). Replaces the Sprint 2.1 panel: current
 * time, today's mission, next action, working window, current energy.
 */
function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <div className="text-label text-fg-subtle">{label}</div>
      <div className={`text-body-m text-fg ${capitalize ? "capitalize" : ""}`}>{value}</div>
    </div>
  );
}

export function MorningContextPanel() {
  const { identity } = useIdentity();
  const timezone = identity?.preferences.timezone ?? "UTC";

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const state = trpc.today.getState.useQuery({});
  const focus = trpc.today.getFocus.useQuery({});
  const metrics = trpc.today.getMetrics.useQuery({});

  const workingHours = selectWorkingHours({
    state: state.data ?? null,
    preferredStartOfDay: identity?.preferences.preferredStartOfDay ?? null,
    preferredEndOfDay: identity?.preferences.preferredEndOfDay ?? null,
  });
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const briefing =
    state.data && focus.data && metrics.data
      ? assembleMorningBriefing({
          now,
          timezone,
          name: identity?.preferences.displayName ?? null,
          state: state.data,
          focus: focus.data,
          metrics: metrics.data,
          workingHours,
          counts: { unreadInbox: 0, pendingDecisions: 0, pendingNotes: 0 },
          yesterday: null,
        })
      : null;

  return (
    <div className="flex flex-col gap-5 p-4">
      <Row label="Current time" value={time} />
      <Row label="Today's mission" value={briefing?.mission.mission ?? "Not set"} />
      <Row label="Next action" value={briefing?.nextAction.action ?? "—"} />
      <Row label="Working window" value={`${workingHours.start} – ${workingHours.end}`} />
      <Row label="Current energy" value={briefing?.energy.current ?? "—"} capitalize />
    </div>
  );
}
