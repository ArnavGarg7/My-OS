"use client";

import { Trash2, MapPin, Repeat } from "lucide-react";
import { Button, Text } from "@myos/ui";
import { describeRecurrence, minutesBetween, type CalendarEvent } from "@myos/core/calendar";
import { PROVIDER_LABEL } from "./calendar-icons";

function dt(iso: string): string {
  return new Date(iso).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
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
 * Event inspector (Sprint 2.7). Details for the selected event — time, duration,
 * location, calendar, provider, recurrence — plus delete.
 */
export function CalendarInspector({
  event,
  calendarName,
  onDelete,
  pending,
}: {
  event: CalendarEvent;
  calendarName: string;
  onDelete: () => void;
  pending: boolean;
}) {
  const duration = minutesBetween(event.startAt, event.endAt);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Text variant="heading-s">{event.title}</Text>
        <Text variant="caption" tone="subtle">
          {event.allDay ? "All day" : `${dt(event.startAt)} · ${duration} min`}
        </Text>
      </div>

      {event.description ? (
        <p className="text-body-s text-fg-muted whitespace-pre-wrap break-words">
          {event.description}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Row label="Status" value={event.status} />
        <Row label="Calendar" value={calendarName} />
        <Row label="Provider" value={PROVIDER_LABEL[event.source]} />
        {event.location ? <Row label="Location" value={event.location} /> : null}
        {event.recurrenceRule ? (
          <Row label="Recurrence" value={describeRecurrence(event.recurrenceRule)} />
        ) : null}
        {event.recurrenceParent ? <Row label="Part of" value="a recurring series" /> : null}
      </div>

      {event.location ? (
        <span className="text-caption text-fg-subtle flex items-center gap-1">
          <MapPin size={12} aria-hidden /> {event.location}
        </span>
      ) : null}
      {event.recurrenceParent ? (
        <span className="text-caption text-fg-subtle flex items-center gap-1">
          <Repeat size={12} aria-hidden /> Recurring occurrence
        </span>
      ) : null}

      {!event.recurrenceParent ? (
        <div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={pending}
            leftIcon={<Trash2 size={14} aria-hidden />}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  );
}
