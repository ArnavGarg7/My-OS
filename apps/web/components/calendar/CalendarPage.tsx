"use client";

import { useState } from "react";
import { Button, Input } from "@myos/ui";
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

/** Inline "new event" form — a title + a 1-hour slot at the next hour. */
function CreateEventInline({
  onCreate,
  close,
}: {
  onCreate: (input: CreateEventInput) => void;
  close: () => void;
}) {
  const [title, setTitle] = useState("");
  const submit = () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60_000);
    onCreate({
      title: title.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      timezone: "UTC",
      allDay: false,
      status: "confirmed",
    });
    close();
  };
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title…"
        onKeyDown={(e) => e.key === "Enter" && title.trim() && submit()}
      />
      <div className="flex justify-end">
        <Button disabled={!title.trim()} onClick={submit}>
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
