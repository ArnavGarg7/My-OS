"use client";

import { useState } from "react";
import { Button, Input, MonoLabel, cn } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useModal } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import type { CreateEventInput } from "@myos/core/calendar";
import { useCalendar } from "./use-calendar";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarAgenda } from "./CalendarAgenda";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarSidebar } from "./CalendarSidebar";
import { CalendarImportDialog } from "./CalendarImportDialog";
import { CalendarExportDialog } from "./CalendarExportDialog";

const DURATIONS = [
  { label: "30 min", min: 30 },
  { label: "1 hour", min: 60 },
  { label: "2 hours", min: 120 },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
/** Today as YYYY-MM-DD and the next full hour as HH:MM, in local time. */
function defaults() {
  const d = new Date();
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad((d.getHours() + 1) % 24)}:00`;
  return { date, time };
}

/** Inline "new event" form — title, when, duration and an all-day toggle. */
function CreateEventInline({
  onCreate,
  close,
}: {
  onCreate: (input: CreateEventInput) => void;
  close: () => void;
}) {
  const init = defaults();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [durationMin, setDurationMin] = useState(60);
  const [allDay, setAllDay] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const submit = () => {
    if (!title.trim() || !date) return;
    let startAt: string;
    let endAt: string;
    if (allDay) {
      startAt = new Date(`${date}T00:00:00`).toISOString();
      endAt = new Date(`${date}T23:59:00`).toISOString();
    } else {
      const start = new Date(`${date}T${time || "09:00"}:00`);
      startAt = start.toISOString();
      endAt = new Date(start.getTime() + durationMin * 60_000).toISOString();
    }
    onCreate({ title: title.trim(), startAt, endAt, timezone, allDay, status: "confirmed" });
    close();
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title…"
        aria-label="Event title"
        onKeyDown={(e) => e.key === "Enter" && title.trim() && submit()}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <MonoLabel tone="subtle">Date</MonoLabel>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {!allDay ? (
          <label className="flex flex-col gap-1">
            <MonoLabel tone="subtle">Start</MonoLabel>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        ) : null}
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            aria-label="All day"
          />
          <MonoLabel tone="subtle">All day</MonoLabel>
        </label>
      </div>

      {!allDay ? (
        <label className="flex flex-col gap-1">
          <MonoLabel tone="subtle">Duration</MonoLabel>
          <div role="radiogroup" aria-label="Duration" className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d.min}
                type="button"
                role="radio"
                aria-checked={durationMin === d.min}
                onClick={() => setDurationMin(d.min)}
                className={cn(
                  "text-caption rounded-md border px-2.5 py-1",
                  durationMin === d.min
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </label>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={!title.trim() || !date} onClick={submit}>
          Create event
        </Button>
      </div>
    </div>
  );
}

/**
 * Calendar page (Sprint 2.7). Toolbar + one of four editorial views + a
 * calendars/free-busy sidebar. Selecting an event opens it in the context panel.
 */
export function CalendarPage() {
  const cal = useCalendar();
  const { open } = useModal();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const select = (id: string) => {
    cal.select(id);
    openContextPanel(true);
  };

  if (cal.isLoading) return <PageLoading label="Loading your calendar…" />;

  const onNew = () =>
    open((close) => <CreateEventInline onCreate={cal.create} close={close} />, {
      title: "New event",
      size: "sm",
    });
  const onImport = () =>
    open(
      (close) => (
        <CalendarImportDialog onImport={cal.importIcs} close={close} pending={cal.pending} />
      ),
      {
        title: "Import calendar",
        size: "md",
      },
    );
  const onExport = () =>
    open(() => <CalendarExportDialog />, { title: "Export calendar", size: "md" });

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <CalendarToolbar cal={cal} onNew={onNew} onImport={onImport} onExport={onExport} />
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto">
            {cal.view === "agenda" ? (
              <CalendarAgenda events={cal.events} selectedId={cal.selectedId} onSelect={select} />
            ) : cal.view === "day" ? (
              <CalendarDayView
                events={cal.events}
                dateKey={cal.dateKey}
                selectedId={cal.selectedId}
                onSelect={select}
              />
            ) : cal.view === "week" ? (
              <CalendarWeekView
                events={cal.events}
                dateKey={cal.dateKey}
                selectedId={cal.selectedId}
                onSelect={select}
              />
            ) : (
              <CalendarMonthView
                events={cal.events}
                dateKey={cal.dateKey}
                onPickDay={(key) => {
                  cal.setDateKey(key);
                  cal.setView("day");
                }}
              />
            )}
          </div>
          <aside className="border-border hidden w-64 shrink-0 overflow-y-auto border-l lg:block">
            <CalendarSidebar cal={cal} />
          </aside>
        </div>
      </PageContent>
    </PageContainer>
  );
}
