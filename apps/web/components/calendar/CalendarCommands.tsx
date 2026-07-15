"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  CalendarClock,
  CalendarRange,
  Upload,
  Download,
  RefreshCw,
  Clock,
  AlertTriangle,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { Button, Input } from "@myos/ui";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useCalendar } from "./use-calendar";
import { CalendarImportDialog } from "./CalendarImportDialog";
import { CalendarExportDialog } from "./CalendarExportDialog";
import { CalendarConflicts } from "./CalendarConflicts";

function CreateEventForm({
  onCreate,
  close,
}: {
  onCreate: (title: string) => void;
  close: () => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title…"
      />
      <div className="flex justify-end">
        <Button
          disabled={!title.trim()}
          onClick={() => {
            onCreate(title.trim());
            close();
          }}
        >
          Create event
        </Button>
      </div>
    </div>
  );
}

/** Calendar command group (Sprint 2.7). Registration only. Mount once in shell. */
export function CalendarCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const { open } = useModal();
  const cal = useCalendar();

  const groups = useMemo<CommandGroup[]>(() => {
    const need = () => toaster.info("Select an event first.");
    const nextHourEvent = (title: string) => {
      const start = new Date();
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
      const end = new Date(start.getTime() + 60 * 60_000);
      cal.create({
        title,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        timezone: "UTC",
        allDay: false,
        status: "confirmed",
      });
    };

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `calendar:${id}`,
      title,
      category: "calendar",
      icon,
      keywords: ["calendar", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "calendar",
        title: "Calendar",
        category: "calendar",
        priority: 93,
        commands: [
          cmd("create", "Create Event", Plus, ["new", "event"], () =>
            open((close) => <CreateEventForm onCreate={nextHourEvent} close={close} />, {
              title: "Create event",
              size: "sm",
            }),
          ),
          cmd("edit", "Edit Event", Pencil, ["edit"], () => {
            if (cal.selected) router.push("/calendar");
            else need();
          }),
          cmd("delete", "Delete Event", Trash2, ["delete", "remove"], () => {
            if (cal.selected) cal.remove(cal.selected.id);
            else need();
          }),
          cmd("duplicate", "Duplicate Event", Copy, ["duplicate", "copy"], () => {
            if (!cal.selected) return need();
            cal.create({
              title: `${cal.selected.title} (copy)`,
              startAt: cal.selected.startAt,
              endAt: cal.selected.endAt,
              timezone: cal.selected.timezone,
              allDay: cal.selected.allDay,
              status: "confirmed",
            });
          }),
          cmd("today", "Open Today", CalendarClock, ["today", "day"], () => {
            cal.setView("day");
            cal.today();
            router.push("/calendar");
          }),
          cmd("week", "Open Week", CalendarRange, ["week"], () => {
            cal.setView("week");
            router.push("/calendar");
          }),
          cmd("import", "Import Calendar", Upload, ["import", "ics"], () =>
            open(
              (close) => (
                <CalendarImportDialog
                  onImport={cal.importIcs}
                  close={close}
                  pending={cal.pending}
                />
              ),
              { title: "Import calendar", size: "md" },
            ),
          ),
          cmd("export", "Export Calendar", Download, ["export", "ics"], () =>
            open(() => <CalendarExportDialog />, { title: "Export calendar", size: "md" }),
          ),
          cmd("sync", "Sync Calendars", RefreshCw, ["sync"], () => cal.sync("google")),
          cmd("now", "Jump to Current Time", Clock, ["now", "current"], () => {
            cal.setView("day");
            cal.today();
            router.push("/calendar");
          }),
          cmd("conflicts", "Show Conflicts", AlertTriangle, ["conflicts"], () =>
            open(() => <CalendarConflicts conflicts={cal.conflicts} />, {
              title: "Conflicts",
              size: "md",
            }),
          ),
          cmd("toggle", "Toggle Calendar", Eye, ["toggle", "hide", "show"], () => {
            const first = cal.calendars[0];
            if (first) cal.toggleCalendar(first.id, !first.visible);
            else toaster.info("No calendars yet.");
          }),
        ],
      },
    ];
  }, [router, toaster, open, cal]);

  useRegisterGroups(groups);
  return null;
}
