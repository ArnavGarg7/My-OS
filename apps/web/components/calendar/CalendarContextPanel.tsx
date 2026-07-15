"use client";

import { Text } from "@myos/ui";
import { useCalendar } from "./use-calendar";
import { CalendarInspector } from "./CalendarInspector";

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
 * Calendar context panel (Sprint 2.7). The selected event's inspector, or a
 * live day summary: current/next event, availability, next focus window, meeting
 * count and sync status.
 */
export function CalendarContextPanel() {
  const cal = useCalendar();

  if (cal.selected) {
    const calendarName =
      cal.calendars.find((c) => c.id === cal.selected!.calendarId)?.name ?? "Calendar";
    return (
      <div className="p-4">
        <CalendarInspector
          event={cal.selected}
          calendarName={calendarName}
          onDelete={() => cal.remove(cal.selected!.id)}
          pending={cal.pending}
        />
      </div>
    );
  }

  const s = cal.summary;
  const fb = s?.freeBusy;
  return (
    <div className="flex flex-col gap-4 p-4">
      <Row label="Meetings today" value={String(s?.meetingCount ?? 0)} />
      <Row label="Current event" value={s?.currentEvent?.title ?? "None right now"} />
      <Row
        label="Next event"
        value={s?.nextEvent ? `${s.nextEvent.title} · ${time(s.nextEvent.startAt)}` : "—"}
      />
      <Row label="Available until" value={fb?.nextFreeWindow ? time(fb.nextFreeWindow.end) : "—"} />
      <Row
        label="Next focus window"
        value={
          fb?.longestFreeSlot
            ? `${time(fb.longestFreeSlot.start)} (${fb.longestFreeSlot.minutes}m)`
            : "—"
        }
      />
      <Row label="Sync status" value={s?.syncStatus ?? "—"} />
      {!s ? (
        <Text variant="body-s" tone="subtle">
          Loading calendar…
        </Text>
      ) : null}
    </div>
  );
}
