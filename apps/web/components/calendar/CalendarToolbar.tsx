"use client";

import { ChevronLeft, ChevronRight, Plus, RefreshCw, Upload, Download } from "lucide-react";
import { Button, cn } from "@myos/ui";
import type { useCalendar, CalendarView } from "./use-calendar";

const VIEWS: CalendarView[] = ["agenda", "day", "week", "month"];

function shift(dateKey: string, view: CalendarView, dir: 1 | -1): string {
  const d = new Date(`${dateKey}T00:00:00`);
  const step = view === "week" ? 7 : view === "month" ? 0 : 1;
  if (view === "month") d.setMonth(d.getMonth() + dir);
  else d.setDate(d.getDate() + dir * (step || 1));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Calendar toolbar (Sprint 2.7): view switch · date nav · new/sync/import/export. */
export function CalendarToolbar({
  cal,
  onNew,
  onImport,
  onExport,
}: {
  cal: ReturnType<typeof useCalendar>;
  onNew: () => void;
  onImport: () => void;
  onExport: () => void;
}) {
  const label = new Date(`${cal.dateKey}T00:00:00`).toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b p-4">
      <div className="flex items-center gap-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => cal.setView(v)}
            aria-pressed={cal.view === v}
            className={cn(
              "text-body-s rounded-md px-2.5 py-1 capitalize outline-none transition-colors",
              cal.view === v ? "bg-accent-muted/40 text-accent" : "text-fg-muted hover:bg-elevated",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Previous"
          onClick={() => cal.setDateKey(shift(cal.dateKey, cal.view, -1))}
        >
          <ChevronLeft size={16} aria-hidden />
        </Button>
        <Button size="sm" variant="ghost" onClick={cal.today}>
          Today
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Next"
          onClick={() => cal.setDateKey(shift(cal.dateKey, cal.view, 1))}
        >
          <ChevronRight size={16} aria-hidden />
        </Button>
        <span className="text-body-s text-fg-muted ml-1">{label}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onImport}
          leftIcon={<Upload size={14} aria-hidden />}
        >
          Import
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onExport}
          leftIcon={<Download size={14} aria-hidden />}
        >
          Export
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => cal.sync("google")}
          loading={cal.pending}
          leftIcon={<RefreshCw size={14} aria-hidden />}
        >
          Sync
        </Button>
        <Button size="sm" onClick={onNew} leftIcon={<Plus size={14} aria-hidden />}>
          New event
        </Button>
      </div>
    </div>
  );
}
