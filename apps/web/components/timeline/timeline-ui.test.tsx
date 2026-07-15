import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TimelineEvent, TimelineGroup as Group } from "@myos/core/timeline";
import { TimelineItem } from "./TimelineItem";
import { TimelineGroup } from "./TimelineGroup";
import { TimelineFeed } from "./TimelineFeed";
import { TimelineSearch } from "./TimelineSearch";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineInspector } from "./TimelineInspector";
import { TimelineMiniCalendar } from "./TimelineMiniCalendar";
import { clockTime, eventIcon, relativeTime, SOURCE_LABEL } from "./timeline-icons";

const iso = (d: number, h = 9) => new Date(Date.UTC(2026, 6, d, h)).toISOString();

function event(over: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: "e1",
    eventType: "goal.completed",
    source: "goal",
    entityId: "g1",
    title: "Shipped v1",
    summary: "Shipped v1",
    timestamp: iso(3),
    importance: 100,
    metadata: {},
    ...over,
  };
}

function group(over: Partial<Group> = {}): Group {
  return {
    key: "2026-07-03",
    label: "Jul 3, 2026",
    grouping: "day",
    events: [event()],
    count: 1,
    ...over,
  };
}

describe("timeline-icons", () => {
  it("labels sources and picks event icons", () => {
    expect(SOURCE_LABEL.goal).toBe("Goal");
    expect(eventIcon(event())).toBeTruthy();
    expect(eventIcon(event({ eventType: "unknown.kind", source: "task" }))).toBeTruthy();
  });
  it("formats relative + clock time", () => {
    const now = new Date(Date.UTC(2026, 6, 3, 9, 5));
    expect(relativeTime(iso(3), now)).toBe("5m ago");
    expect(clockTime(iso(3))).toMatch(/\d{2}:\d{2}/);
  });
});

describe("TimelineItem", () => {
  it("renders title, source + a milestone badge for high importance", () => {
    render(<TimelineItem event={event()} />);
    expect(screen.getByText("Shipped v1")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Milestone")).toBeInTheDocument();
  });
  it("omits the milestone badge for low importance", () => {
    render(<TimelineItem event={event({ eventType: "task.created", importance: 20 })} />);
    expect(screen.queryByText("Milestone")).not.toBeInTheDocument();
  });
  it("selects on click", async () => {
    const onSelect = vi.fn();
    render(<TimelineItem event={event()} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Shipped v1"));
    expect(onSelect).toHaveBeenCalledWith("e1");
  });
});

describe("TimelineGroup", () => {
  it("shows the label and event count", () => {
    render(<TimelineGroup group={group()} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Jul 3, 2026")).toBeInTheDocument();
    expect(screen.getByText("1 event")).toBeInTheDocument();
  });
});

describe("TimelineFeed", () => {
  it("renders grouped buckets", () => {
    render(
      <TimelineFeed
        groups={[group()]}
        events={[event()]}
        searching={false}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Shipped v1")).toBeInTheDocument();
  });
  it("shows an empty state with no groups", () => {
    render(
      <TimelineFeed
        groups={[]}
        events={[]}
        searching={false}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Your history starts here")).toBeInTheDocument();
  });
  it("renders flat search results", () => {
    render(
      <TimelineFeed
        groups={[]}
        events={[event({ title: "Found it" })]}
        searching
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Found it")).toBeInTheDocument();
  });
  it("shows a no-results state when searching finds nothing", () => {
    render(<TimelineFeed groups={[]} events={[]} searching selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("No matching events")).toBeInTheDocument();
  });
});

describe("TimelineSearch", () => {
  it("emits query changes", async () => {
    const onChange = vi.fn();
    render(<TimelineSearch value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Search timeline"), "goal");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("TimelineFilters", () => {
  it("toggles a source", async () => {
    const onToggle = vi.fn();
    render(
      <TimelineFilters
        sources={[]}
        onToggleSource={onToggle}
        grouping="day"
        onGrouping={vi.fn()}
        minImportance={0}
        onMinImportance={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Goal" }));
    expect(onToggle).toHaveBeenCalledWith("goal");
  });
  it("changes grouping", async () => {
    const onGrouping = vi.fn();
    render(
      <TimelineFilters
        sources={[]}
        onToggleSource={vi.fn()}
        grouping="day"
        onGrouping={onGrouping}
        minImportance={0}
        onMinImportance={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Week" }));
    expect(onGrouping).toHaveBeenCalledWith("week");
  });
});

describe("TimelineInspector", () => {
  const base = {
    neighbors: { previous: null, next: null },
    related: [] as TimelineEvent[],
    onSelect: vi.fn(),
    onPin: vi.fn(),
  };

  it("renders the event with source + importance", () => {
    render(<TimelineInspector event={event()} {...base} />);
    expect(screen.getByText("Shipped v1")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
  it("pins as a memory", async () => {
    const onPin = vi.fn();
    render(<TimelineInspector event={event()} {...base} onPin={onPin} />);
    await userEvent.click(screen.getByRole("button", { name: /Pin as memory/ }));
    expect(onPin).toHaveBeenCalledWith("e1");
  });
  it("renders metadata details", () => {
    render(<TimelineInspector event={event({ metadata: { focusMinutes: 90 } })} {...base} />);
    expect(screen.getByText("focusMinutes")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });
  it("navigates to related events", async () => {
    const onSelect = vi.fn();
    render(
      <TimelineInspector
        event={event()}
        {...base}
        onSelect={onSelect}
        related={[event({ id: "e2", title: "Related one" })]}
      />,
    );
    await userEvent.click(screen.getByText(/Related one/));
    expect(onSelect).toHaveBeenCalledWith("e2");
  });
});

describe("TimelineMiniCalendar", () => {
  it("renders 14 day cells", () => {
    render(<TimelineMiniCalendar events={[event()]} />);
    const cells = screen.getAllByRole("button");
    expect(cells).toHaveLength(14);
  });
  it("picks a date on click", async () => {
    const onPick = vi.fn();
    const today = new Date().toISOString().slice(0, 10);
    render(
      <TimelineMiniCalendar
        events={[event({ timestamp: `${today}T09:00:00.000Z` })]}
        onPickDate={onPick}
      />,
    );
    const cells = screen.getAllByRole("button");
    await userEvent.click(cells[cells.length - 1]!);
    expect(onPick).toHaveBeenCalledWith(today);
  });
});
