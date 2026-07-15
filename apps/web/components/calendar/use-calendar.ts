"use client";

import { useMemo, useState } from "react";
import type { CalendarProvider, CreateEventInput } from "@myos/core/calendar";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

export type CalendarView = "agenda" | "day" | "week" | "month";

function toKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Compute the [from, to) window for a view anchored on a date. */
function viewRange(view: CalendarView, dateKey: string): { from: string; to: string } {
  const anchor = new Date(`${dateKey}T00:00:00`);
  const start = new Date(anchor);
  let days = 1;
  if (view === "agenda") days = 14;
  else if (view === "day") days = 1;
  else if (view === "week") {
    start.setDate(start.getDate() - start.getDay());
    days = 7;
  } else {
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  const end = new Date(start.getTime() + days * 86_400_000);
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * Client calendar controller (Sprint 2.7). Owns the view + date, fetches events
 * for the visible range (recurrence expanded server-side), and exposes the
 * event lifecycle + sync mutations. Selection is shared via the shell store.
 */
export function useCalendar() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const selectedId = useShellStore((s) => s.selectedEventId);
  const setSelectedId = useShellStore((s) => s.setSelectedEventId);

  const [view, setView] = useState<CalendarView>("agenda");
  const [dateKey, setDateKey] = useState<string>(() => toKey(new Date()));

  const range = useMemo(() => viewRange(view, dateKey), [view, dateKey]);
  const listQuery = trpc.calendar.list.useQuery(range);
  const summaryQuery = trpc.calendar.summary.useQuery({});
  const conflictsQuery = trpc.calendar.conflicts.useQuery({});
  const providersQuery = trpc.calendar.providers.useQuery();

  const events = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const refresh = () => {
    utils.calendar.list.invalidate();
    utils.calendar.summary.invalidate();
    utils.calendar.conflicts.invalidate();
  };

  const createM = trpc.calendar.create.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Event created");
    },
    onError: (e) => toaster.error("Couldn't create", e.message),
  });
  const updateM = trpc.calendar.update.useMutation({ onSuccess: refresh });
  const deleteM = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
  });
  const syncM = trpc.calendar.sync.useMutation({
    onSuccess: (r) => {
      refresh();
      utils.calendar.providers.invalidate();
      toaster.success(`Synced ${r.provider}`, `${r.imported} new, ${r.updated} updated`);
    },
    onError: (e) => toaster.error("Sync failed", e.message),
  });
  const importM = trpc.calendar.import.useMutation({
    onSuccess: (r) => {
      refresh();
      toaster.success("Imported", `${r.imported} events`);
    },
    onError: (e) => toaster.error("Import failed", e.message),
  });
  const toggleM = trpc.calendar.toggle.useMutation({
    onSuccess: () => utils.calendar.providers.invalidate(),
  });

  return {
    view,
    setView,
    dateKey,
    setDateKey,
    today: () => setDateKey(toKey(new Date())),
    events,
    isLoading: listQuery.isLoading,
    summary: summaryQuery.data ?? null,
    conflicts: conflictsQuery.data ?? [],
    calendars: providersQuery.data?.calendars ?? [],
    availableProviders: providersQuery.data?.available ?? [],
    selected: events.find((e) => e.id === selectedId) ?? null,
    selectedId,
    select: (id: string | null) => setSelectedId(id),
    create: (input: CreateEventInput) => createM.mutate(input),
    update: (input: Parameters<typeof updateM.mutate>[0]) => updateM.mutate(input),
    remove: (id: string) => deleteM.mutate({ id }),
    sync: (provider: CalendarProvider) => syncM.mutate({ provider }),
    importIcs: (ics: string) => importM.mutate({ ics }),
    toggleCalendar: (id: string, visible: boolean) => toggleM.mutate({ id, visible }),
    pending:
      createM.isPending ||
      updateM.isPending ||
      deleteM.isPending ||
      syncM.isPending ||
      importM.isPending,
  };
}
