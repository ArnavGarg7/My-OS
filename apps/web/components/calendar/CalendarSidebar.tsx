"use client";

import { Text, Switch } from "@myos/ui";
import type { useCalendar } from "./use-calendar";
import { PROVIDER_LABEL } from "./calendar-icons";
import { CalendarConflicts } from "./CalendarConflicts";

/** Calendar sidebar (Sprint 2.7): calendars + free/busy + conflicts. */
export function CalendarSidebar({ cal }: { cal: ReturnType<typeof useCalendar> }) {
  const fb = cal.summary?.freeBusy;
  return (
    <div className="flex flex-col gap-5 p-4">
      <section className="flex flex-col gap-2">
        <Text variant="label" tone="subtle">
          Calendars
        </Text>
        {cal.calendars.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2">
            <span className="text-body-s text-fg-muted flex items-center gap-2">
              <span aria-hidden className="bg-accent size-2 rounded-full" />
              {c.name}
              <span className="text-caption text-fg-subtle">{PROVIDER_LABEL[c.provider]}</span>
            </span>
            <Switch
              checked={c.visible}
              onCheckedChange={(v) => cal.toggleCalendar(c.id, v)}
              aria-label={`Toggle ${c.name}`}
            />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-1">
        <Text variant="label" tone="subtle">
          Free / Busy
        </Text>
        <Text variant="body-s" tone="muted">
          {fb ? `${fb.busyPercent}% busy · ${fb.freeMinutes} min free` : "—"}
        </Text>
        <Text variant="caption" tone="subtle">
          {fb ? `${fb.meetingMinutes} min meetings · ${fb.focusMinutes} min focus` : ""}
        </Text>
      </section>

      <section className="flex flex-col gap-2">
        <Text variant="label" tone="subtle">
          Conflicts
        </Text>
        <CalendarConflicts conflicts={cal.conflicts} />
      </section>
    </div>
  );
}
