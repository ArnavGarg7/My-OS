import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Conflict, PlannerBlock } from "@myos/core/planner";
import { TimelineBlock } from "./TimelineBlock";
import { TimelineHour } from "./TimelineHour";
import { PlannerTimeline } from "./PlannerTimeline";
import { PlannerToolbar } from "./PlannerToolbar";
import { PlannerLegend } from "./PlannerLegend";
import { PlannerFilters } from "./PlannerFilters";
import { PlannerConflictDialog } from "./PlannerConflictDialog";
import { PlannerSchedule } from "./PlannerSchedule";
import { PlannerRecommendations } from "./PlannerRecommendations";
import { PlannerMiniCalendar } from "./PlannerMiniCalendar";
import { PlannerNowIndicator } from "./PlannerNowIndicator";
import type { usePlanner } from "./use-planner";

const DATE = "2026-07-07";
function block(over: Partial<PlannerBlock> = {}): PlannerBlock {
  return {
    id: "b1",
    plannerDate: DATE,
    taskId: null,
    type: "task",
    title: "Research",
    startTime: `${DATE}T09:00:00.000Z`,
    endTime: `${DATE}T10:00:00.000Z`,
    locked: false,
    generated: true,
    completed: false,
    source: "generated",
    createdAt: `${DATE}T06:00:00.000Z`,
    ...over,
  };
}

describe("TimelineBlock", () => {
  it("renders the title and selects on click", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TimelineBlock block={block()} selected={false} onSelect={onSelect} />);
    expect(screen.getByText("Research")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });
  it("marks selection via aria-pressed", () => {
    render(<TimelineBlock block={block()} selected onSelect={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
  it("shows a lock affordance for locked blocks", () => {
    render(<TimelineBlock block={block({ locked: true })} selected={false} onSelect={() => {}} />);
    expect(screen.getByLabelText("Locked")).toBeInTheDocument();
  });
});

describe("TimelineHour", () => {
  it("renders the hour label and its blocks", () => {
    render(<TimelineHour hour={9} blocks={[block()]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("9 AM")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
  });
  it("renders an empty hour without blocks", () => {
    render(<TimelineHour hour={14} blocks={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("2 PM")).toBeInTheDocument();
  });
});

describe("PlannerTimeline", () => {
  it("shows an empty state with no blocks", () => {
    render(
      <PlannerTimeline blocks={[]} selectedId={null} visibleTypes={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("No plan yet")).toBeInTheDocument();
  });
  it("renders blocks grouped by hour", () => {
    render(
      <PlannerTimeline
        blocks={[
          block({ id: "a", title: "A" }),
          block({
            id: "b",
            title: "B",
            startTime: `${DATE}T11:00:00.000Z`,
            endTime: `${DATE}T12:00:00.000Z`,
          }),
        ]}
        selectedId={null}
        visibleTypes={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
  it("shows an overflow section", () => {
    render(
      <PlannerTimeline
        blocks={[
          block({
            id: "o",
            type: "overflow",
            title: "Late",
            startTime: `${DATE}T19:00:00.000Z`,
            endTime: `${DATE}T20:00:00.000Z`,
          }),
        ]}
        selectedId={null}
        visibleTypes={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("After hours (overflow)")).toBeInTheDocument();
    expect(screen.getByText("Late")).toBeInTheDocument();
  });
  it("hides types filtered out of the visible set", () => {
    render(
      <PlannerTimeline
        blocks={[block({ id: "a", title: "Hidden", type: "task" })]}
        selectedId={null}
        visibleTypes={new Set(["meeting"])}
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});

function mockPlanner(over: Partial<ReturnType<typeof usePlanner>> = {}) {
  return {
    day: {
      date: DATE,
      generatedAt: null,
      workingStart: "09:00",
      workingEnd: "18:00",
      focusWindowStart: null,
      focusWindowEnd: null,
      status: "generated",
      locked: false,
    },
    blocks: [block()],
    conflicts: [] as Conflict[],
    utilization: {
      scheduledMinutes: 60,
      workingMinutes: 540,
      freeMinutes: 480,
      percentUtilized: 11,
    },
    isLoading: false,
    selected: null,
    selectedId: null,
    select: vi.fn(),
    generate: vi.fn(),
    optimize: vi.fn(),
    clear: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    move: vi.fn(),
    pending: false,
    ...over,
  } as unknown as ReturnType<typeof usePlanner>;
}

describe("PlannerToolbar", () => {
  it("shows Regenerate once a plan exists and triggers generate", async () => {
    const planner = mockPlanner();
    const user = userEvent.setup();
    render(<PlannerToolbar planner={planner} />);
    await user.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(planner.generate).toHaveBeenCalledOnce();
  });
  it("shows Generate Plan when empty", () => {
    render(
      <PlannerToolbar
        planner={mockPlanner({ blocks: [], day: { ...mockPlanner().day!, status: "empty" } })}
      />,
    );
    expect(screen.getByRole("button", { name: /generate plan/i })).toBeInTheDocument();
  });
  it("surfaces a conflict badge", () => {
    render(
      <PlannerToolbar
        planner={mockPlanner({
          conflicts: [{ type: "overlap", message: "x", blockIds: [], taskIds: [] }],
        })}
      />,
    );
    expect(screen.getByText(/1 conflict/)).toBeInTheDocument();
  });
});

describe("PlannerLegend", () => {
  it("lists every block type", () => {
    render(<PlannerLegend />);
    for (const label of ["Focus", "Meeting", "Task", "Break", "Buffer", "Overflow"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("PlannerFilters", () => {
  it("toggles a type", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<PlannerFilters visible={null} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /focus/i }));
    expect(onToggle).toHaveBeenCalledWith("focus");
  });
});

describe("PlannerConflictDialog", () => {
  it("shows a clean message with no conflicts", () => {
    render(<PlannerConflictDialog conflicts={[]} />);
    expect(screen.getByText(/plan is clean/i)).toBeInTheDocument();
  });
  it("lists conflicts", () => {
    render(
      <PlannerConflictDialog
        conflicts={[{ type: "overlap", message: "A overlaps B", blockIds: [], taskIds: [] }]}
      />,
    );
    expect(screen.getByText("A overlaps B")).toBeInTheDocument();
  });
});

describe("PlannerSchedule", () => {
  it("shows an empty message", () => {
    render(<PlannerSchedule blocks={[]} />);
    expect(screen.getByText("Nothing scheduled.")).toBeInTheDocument();
  });
  it("lists blocks", () => {
    render(<PlannerSchedule blocks={[block({ title: "Design" })]} />);
    expect(screen.getByText("Design")).toBeInTheDocument();
  });
});

describe("PlannerRecommendations", () => {
  it("shows the next task block", () => {
    render(
      <PlannerRecommendations
        blocks={[block({ taskId: "t", title: "Ship" })]}
        now={new Date(`${DATE}T08:00:00.000Z`)}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("Ship")).toBeInTheDocument();
    expect(screen.getByText("Up next")).toBeInTheDocument();
  });
  it("shows an empty message when nothing is ahead", () => {
    render(<PlannerRecommendations blocks={[]} now={new Date()} onSelect={() => {}} />);
    expect(screen.getByText(/no upcoming work/i)).toBeInTheDocument();
  });
});

describe("PlannerMiniCalendar", () => {
  it("renders a month grid", () => {
    render(<PlannerMiniCalendar date={DATE} />);
    expect(screen.getByText(/July 2026/)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});

describe("PlannerNowIndicator", () => {
  it("renders a current-time label", () => {
    render(<PlannerNowIndicator />);
    expect(screen.getByLabelText("Current time")).toBeInTheDocument();
  });
});

describe("PlannerToolbar disabled state", () => {
  it("disables Optimize and Clear when there is no plan", () => {
    render(
      <PlannerToolbar
        planner={mockPlanner({ blocks: [], day: { ...mockPlanner().day!, status: "empty" } })}
      />,
    );
    expect(screen.getByRole("button", { name: /optimize/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
  });
});

describe("PlannerFilters visibility", () => {
  it("dims a hidden type", () => {
    render(<PlannerFilters visible={new Set(["meeting"])} onToggle={() => {}} />);
    // Focus is hidden (not in the visible set) → not pressed
    expect(screen.getByRole("button", { name: /focus/i })).toHaveAttribute("aria-pressed", "false");
  });
});
