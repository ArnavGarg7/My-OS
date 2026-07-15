import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CalendarConflict, CalendarEvent, Interval } from "@myos/core/calendar";
import { CalendarEventCard } from "./CalendarEventCard";
import { CalendarAgenda } from "./CalendarAgenda";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarAvailability } from "./CalendarAvailability";
import { CalendarConflicts } from "./CalendarConflicts";
import { CalendarInspector } from "./CalendarInspector";
import { CalendarImportDialog } from "./CalendarImportDialog";
import { CalendarSyncSettings } from "./CalendarSyncSettings";
import { CalendarToolbar } from "./CalendarToolbar";
import { PROVIDER_LABEL, STATUS_DOT } from "./calendar-icons";
import type { useCalendar } from "./use-calendar";

const DATE = "2026-07-07";
function iso(h: number, m = 0): string {
  const d = new Date(`${DATE}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function event(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    title: "Standup",
    description: "",
    calendarId: "cal1",
    location: "",
    startAt: iso(9),
    endAt: iso(10),
    timezone: "UTC",
    allDay: false,
    status: "confirmed",
    source: "local",
    recurrenceRule: null,
    recurrenceParent: null,
    createdAt: iso(6),
    updatedAt: iso(6),
    ...over,
  };
}

describe("CalendarEventCard", () => {
  it("renders the title and selects on click", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<CalendarEventCard event={event()} selected={false} onSelect={onSelect} />);
    expect(screen.getByText("Standup")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });
  it("shows all-day events", () => {
    render(
      <CalendarEventCard event={event({ allDay: true })} selected={false} onSelect={() => {}} />,
    );
    expect(screen.getByText("All day")).toBeInTheDocument();
  });
  it("marks recurring occurrences", () => {
    render(
      <CalendarEventCard
        event={event({ recurrenceParent: "p" })}
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByLabelText("Recurring")).toBeInTheDocument();
  });
  it("shows location", () => {
    render(
      <CalendarEventCard
        event={event({ location: "Zoom" })}
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("Zoom")).toBeInTheDocument();
  });
  it("marks the selected card via aria-pressed", () => {
    render(<CalendarEventCard event={event()} selected onSelect={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("CalendarAgenda", () => {
  it("shows an empty state", () => {
    render(<CalendarAgenda events={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
  });
  it("groups and renders events", () => {
    render(
      <CalendarAgenda
        events={[
          event({ id: "a", title: "A" }),
          event({ id: "b", title: "B", startAt: iso(11), endAt: iso(12) }),
        ]}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("CalendarDayView", () => {
  it("renders events for the day", () => {
    render(
      <CalendarDayView
        events={[event({ title: "Meeting" })]}
        dateKey={DATE}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("Meeting")).toBeInTheDocument();
  });
  it("shows an hour label", () => {
    render(
      <CalendarDayView
        events={[event({ startAt: iso(9), endAt: iso(10) })]}
        dateKey={DATE}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("9 AM")).toBeInTheDocument();
  });
});

describe("CalendarConflicts type label", () => {
  it("humanizes the conflict type", () => {
    render(
      <CalendarConflicts
        conflicts={[{ type: "outside-working-hours", message: "late", eventIds: [] }]}
      />,
    );
    expect(screen.getByText(/outside working hours/i)).toBeInTheDocument();
  });
});

describe("CalendarWeekView", () => {
  it("renders a 7-day grid with events", () => {
    render(
      <CalendarWeekView
        events={[event({ title: "Sync" })]}
        dateKey={DATE}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole("gridcell")).toHaveLength(7);
    expect(screen.getByText(/Sync/)).toBeInTheDocument();
  });
});

describe("CalendarMonthView", () => {
  it("renders a month grid and picks a day", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<CalendarMonthView events={[event()]} dateKey={DATE} onPickDay={onPick} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    await user.click(screen.getByText("7"));
    expect(onPick).toHaveBeenCalled();
  });
  it("shows an event count badge on the event's day", () => {
    render(
      <CalendarMonthView
        events={[event(), event({ id: "e2" })]}
        dateKey={DATE}
        onPickDay={() => {}}
      />,
    );
    // DATE is the 7th; its cell shows the day number 7 plus a "2" count badge.
    const day7 = screen.getByText("7").closest("button")!;
    expect(day7.textContent).toContain("2");
  });
});

describe("CalendarAvailability", () => {
  const intervals: Interval[] = [
    { start: iso(9), end: iso(10), type: "available", label: "Available" },
    { start: iso(10), end: iso(11), type: "meeting", label: "Meeting" },
    { start: iso(0), end: iso(9), type: "personal", label: "Personal time" },
  ];
  it("renders classified intervals", () => {
    render(<CalendarAvailability intervals={intervals} />);
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Meeting")).toBeInTheDocument();
  });
  it("hides personal time", () => {
    render(<CalendarAvailability intervals={intervals} />);
    expect(screen.queryByText("Personal time")).not.toBeInTheDocument();
  });
  it("shows an empty message", () => {
    render(<CalendarAvailability intervals={[]} />);
    expect(screen.getByText("No availability computed.")).toBeInTheDocument();
  });
});

describe("CalendarConflicts", () => {
  it("shows a clean message", () => {
    render(<CalendarConflicts conflicts={[]} />);
    expect(screen.getByText(/calendar is clean/i)).toBeInTheDocument();
  });
  it("lists conflicts", () => {
    const conflicts: CalendarConflict[] = [
      { type: "double-booking", message: "A vs B", eventIds: [] },
    ];
    render(<CalendarConflicts conflicts={conflicts} />);
    expect(screen.getByText("A vs B")).toBeInTheDocument();
  });
});

describe("CalendarInspector", () => {
  it("renders details and deletes", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <CalendarInspector
        event={event({ location: "HQ" })}
        calendarName="Personal"
        onDelete={onDelete}
        pending={false}
      />,
    );
    expect(screen.getByText("Standup")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
  it("describes recurrence", () => {
    render(
      <CalendarInspector
        event={event({ recurrenceRule: { frequency: "weekly", interval: 1 } })}
        calendarName="Personal"
        onDelete={() => {}}
        pending={false}
      />,
    );
    expect(screen.getByText("Every week")).toBeInTheDocument();
  });
  it("hides delete for a recurring occurrence", () => {
    render(
      <CalendarInspector
        event={event({ recurrenceParent: "p" })}
        calendarName="Personal"
        onDelete={() => {}}
        pending={false}
      />,
    );
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});

describe("CalendarImportDialog", () => {
  it("disables import until content is entered", async () => {
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(<CalendarImportDialog onImport={onImport} close={() => {}} pending={false} />);
    const btn = screen.getByRole("button", { name: /import events/i });
    expect(btn).toBeDisabled();
    await user.type(screen.getByLabelText("ICS content"), "BEGIN:VEVENT");
    expect(btn).toBeEnabled();
  });
});

function mockCal(over: Partial<ReturnType<typeof useCalendar>> = {}) {
  return {
    view: "agenda",
    setView: vi.fn(),
    dateKey: DATE,
    setDateKey: vi.fn(),
    today: vi.fn(),
    events: [],
    isLoading: false,
    summary: null,
    conflicts: [],
    calendars: [],
    availableProviders: ["google", "outlook", "apple", "ics", "local"],
    selected: null,
    selectedId: null,
    select: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    sync: vi.fn(),
    importIcs: vi.fn(),
    toggleCalendar: vi.fn(),
    pending: false,
    ...over,
  } as unknown as ReturnType<typeof useCalendar>;
}

describe("CalendarToolbar", () => {
  it("switches views", async () => {
    const cal = mockCal();
    const user = userEvent.setup();
    render(<CalendarToolbar cal={cal} onNew={() => {}} onImport={() => {}} onExport={() => {}} />);
    await user.click(screen.getByRole("button", { name: /^week$/i }));
    expect(cal.setView).toHaveBeenCalledWith("week");
  });
  it("triggers a new event", async () => {
    const onNew = vi.fn();
    const user = userEvent.setup();
    render(
      <CalendarToolbar cal={mockCal()} onNew={onNew} onImport={() => {}} onExport={() => {}} />,
    );
    await user.click(screen.getByRole("button", { name: /new event/i }));
    expect(onNew).toHaveBeenCalledOnce();
  });
});

describe("CalendarSyncSettings", () => {
  it("lists providers and triggers sync", async () => {
    const cal = mockCal();
    const user = userEvent.setup();
    render(<CalendarSyncSettings cal={cal} />);
    expect(screen.getByText("Google")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /sync/i })[0]!);
    expect(cal.sync).toHaveBeenCalled();
  });
  it("omits the local provider", () => {
    render(<CalendarSyncSettings cal={mockCal()} />);
    expect(screen.queryByText("Local")).not.toBeInTheDocument();
  });
});

describe("calendar-icons", () => {
  it("maps provider labels and status dots", () => {
    expect(PROVIDER_LABEL.google).toBe("Google");
    expect(STATUS_DOT.confirmed).toContain("success");
  });
});
