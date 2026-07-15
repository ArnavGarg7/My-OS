import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  CalendarMerge,
  CarryForwardList,
  ChecklistProgress,
  DayReview as Review,
  PlannerPreview as Preview,
  RankedPriority,
  TomorrowReadiness as Readiness,
} from "@myos/core/tomorrow";
import { DayReview } from "./DayReview";
import { CarryForward } from "./CarryForward";
import { PrioritySelection } from "./PrioritySelection";
import { TomorrowCalendar } from "./TomorrowCalendar";
import { PlannerPreview } from "./PlannerPreview";
import { TomorrowReadiness } from "./TomorrowReadiness";
import { TomorrowChecklist } from "./TomorrowChecklist";
import { StudioStepper } from "./StudioStepper";
import { StudioProgress } from "./StudioProgress";
import { minutesLabel, readinessTone, STEP_ICON } from "./tomorrow-icons";

const iso = (h: number, m = 0) => new Date(Date.UTC(2026, 6, 8, h, m)).toISOString();

function review(over: Partial<Review> = {}): Review {
  return {
    planningDate: "2026-07-07",
    tasksCompleted: 6,
    tasksCreated: 2,
    completionScore: 82,
    plannerAccuracy: 80,
    decisionsAccepted: 2,
    deepWorkMinutes: 150,
    calendarCompletion: 100,
    goalProgress: 65,
    healthReadiness: 77,
    journalCompleted: true,
    headline: "A strong day.",
    ...over,
  };
}

describe("tomorrow-icons", () => {
  it("labels minutes", () => {
    expect(minutesLabel(150)).toBe("2h 30m");
    expect(minutesLabel(45)).toBe("45m");
    expect(minutesLabel(120)).toBe("2h");
  });
  it("tones readiness by band", () => {
    expect(readinessTone(80)).toContain("success");
    expect(readinessTone(65)).toContain("warning");
    expect(readinessTone(40)).toContain("danger");
  });
  it("maps every step to an icon", () => {
    expect(STEP_ICON.review).toBeTruthy();
    expect(STEP_ICON.finalize).toBeTruthy();
  });
});

describe("DayReview", () => {
  it("renders the headline + key stats", () => {
    render(<DayReview review={review()} />);
    expect(screen.getByText("A strong day.")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("2h 30m")).toBeInTheDocument();
  });
  it("shows journal done", () => {
    render(<DayReview review={review({ journalCompleted: true })} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});

function carryList(over: Partial<CarryForwardList> = {}): CarryForwardList {
  return {
    items: [
      {
        id: "cf1",
        kind: "task",
        title: "Finish report",
        reason: "Overdue",
        entityId: "t1",
        priority: "high",
      },
      { id: "cf2", kind: "inbox", title: "Read spec", reason: "Unprocessed", entityId: "i1" },
    ],
    byKind: { task: 1, planner_block: 0, milestone: 0, decision: 0, inbox: 1 },
    total: 2,
    overloaded: false,
    ...over,
  };
}

describe("CarryForward", () => {
  it("lists candidates + toggles selection", async () => {
    const onToggle = vi.fn();
    render(<CarryForward list={carryList()} accepted={new Set()} onToggle={onToggle} />);
    expect(screen.getByText("Finish report")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Finish report"));
    expect(onToggle).toHaveBeenCalledWith("cf1");
  });
  it("warns when overloaded", () => {
    render(
      <CarryForward
        list={carryList({ total: 10, overloaded: true })}
        accepted={new Set()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText(/10 items are unfinished/)).toBeInTheDocument();
  });
  it("shows a clean-close empty state", () => {
    render(
      <CarryForward
        list={carryList({ items: [], total: 0 })}
        accepted={new Set()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Nothing to carry forward")).toBeInTheDocument();
  });
});

function ranked(): RankedPriority[] {
  return [
    { id: "p1", kind: "task", title: "Ship v2", entityId: "t1", score: 8.5, rank: 1 },
    { id: "p2", kind: "goal", title: "Study", entityId: "g1", score: 4, rank: 2 },
    { id: "p3", kind: "task", title: "Refactor", entityId: "t2", score: 3, rank: 3 },
    { id: "p4", kind: "task", title: "Extra", entityId: "t3", score: 1, rank: 4 },
  ];
}

describe("PrioritySelection", () => {
  it("renders ranked candidates with Top badges", () => {
    render(<PrioritySelection ranked={ranked()} chosen={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText("Ship v2")).toBeInTheDocument();
    expect(screen.getAllByText("Top")).toHaveLength(3);
  });
  it("toggles a priority", async () => {
    const onToggle = vi.fn();
    render(<PrioritySelection ranked={ranked()} chosen={new Set()} onToggle={onToggle} />);
    await userEvent.click(screen.getByText("Ship v2"));
    expect(onToggle).toHaveBeenCalledWith("p1");
  });
  it("shows the selected count", () => {
    render(<PrioritySelection ranked={ranked()} chosen={new Set(["p1"])} onToggle={vi.fn()} />);
    expect(screen.getByText(/1\/5 selected/)).toBeInTheDocument();
  });
  it("empty state with no candidates", () => {
    render(<PrioritySelection ranked={[]} chosen={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText(/No open work/)).toBeInTheDocument();
  });
});

function merge(over: Partial<CalendarMerge> = {}): CalendarMerge {
  return {
    events: [
      { id: "e1", title: "Standup", start: iso(9), end: iso(9, 30), kind: "meeting" },
      { id: "e2", title: "Lecture", start: iso(11), end: iso(12, 30), kind: "class" },
    ],
    meetingMinutes: 120,
    meetingCount: 2,
    firstEventAt: iso(9),
    lastEventEndsAt: iso(12, 30),
    freeWindows: [{ start: iso(9, 30), end: iso(11), minutes: 90 }],
    meetingHeavy: false,
    ...over,
  };
}

describe("TomorrowCalendar", () => {
  it("renders events + meeting summary", () => {
    render(<TomorrowCalendar merge={merge()} />);
    expect(screen.getByText("Standup")).toBeInTheDocument();
    expect(screen.getByText(/2 meetings/)).toBeInTheDocument();
  });
  it("flags a meeting-heavy day", () => {
    render(<TomorrowCalendar merge={merge({ meetingHeavy: true })} />);
    expect(screen.getByText("Meeting-heavy")).toBeInTheDocument();
  });
  it("empty state for a clear day", () => {
    render(<TomorrowCalendar merge={merge({ events: [] })} />);
    expect(screen.getByText("A clear day")).toBeInTheDocument();
  });
  it("notes free focus windows", () => {
    render(<TomorrowCalendar merge={merge()} />);
    expect(screen.getByText(/1 free window/)).toBeInTheDocument();
  });
  it("labels event kinds", () => {
    render(<TomorrowCalendar merge={merge()} />);
    expect(screen.getByText("class")).toBeInTheDocument();
  });
});

function preview(over: Partial<Preview> = {}): Preview {
  return {
    targetDate: "2026-07-08",
    blocks: [
      {
        id: "b1",
        title: "Deep work",
        start: iso(9),
        end: iso(11),
        kind: "focus",
        minutes: 120,
        locked: false,
      },
    ],
    totalMinutes: 120,
    blockCount: 1,
    utilization: 25,
    status: "draft",
    ...over,
  };
}

describe("PlannerPreview", () => {
  it("prompts to generate when empty", async () => {
    const onGenerate = vi.fn();
    render(<PlannerPreview preview={null} onGenerate={onGenerate} onDiscard={vi.fn()} />);
    expect(screen.getByText("Draft tomorrow's plan")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Generate preview/ }));
    expect(onGenerate).toHaveBeenCalled();
  });
  it("renders a draft plan + discard", async () => {
    const onDiscard = vi.fn();
    render(<PlannerPreview preview={preview()} onGenerate={vi.fn()} onDiscard={onDiscard} />);
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Discard/ }));
    expect(onDiscard).toHaveBeenCalled();
  });
  it("regenerates a plan", async () => {
    const onGenerate = vi.fn();
    render(<PlannerPreview preview={preview()} onGenerate={onGenerate} onDiscard={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Regenerate/ }));
    expect(onGenerate).toHaveBeenCalled();
  });
  it("shows block count + utilisation", () => {
    render(<PlannerPreview preview={preview()} onGenerate={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.getByText(/1 blocks/)).toBeInTheDocument();
    expect(screen.getByText(/Utilisation 25%/)).toBeInTheDocument();
  });
});

function readiness(over: Partial<Readiness> = {}): Readiness {
  return {
    sleepTargetMinutes: 450,
    expectedWorkloadMinutes: 180,
    meetingMinutes: 120,
    meetingDensity: 25,
    healthReadiness: 78,
    focusOpportunityMinutes: 180,
    intensity: "moderate",
    recoveryRecommendation: "You're set for a productive day.",
    score: 72,
    ...over,
  };
}

describe("TomorrowReadiness", () => {
  it("renders the score + recommendation", () => {
    render(<TomorrowReadiness readiness={readiness()} />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("moderate")).toBeInTheDocument();
    expect(screen.getByText("You're set for a productive day.")).toBeInTheDocument();
  });
  it("shows sleep target + focus window", () => {
    render(<TomorrowReadiness readiness={readiness()} />);
    expect(screen.getByText("Sleep target")).toBeInTheDocument();
    expect(screen.getByText("Focus window")).toBeInTheDocument();
  });
  it("flags a low-readiness recovery note", () => {
    render(
      <TomorrowReadiness
        readiness={readiness({ score: 45, recoveryRecommendation: "Lower tomorrow's intensity." })}
      />,
    );
    expect(screen.getByText("Lower tomorrow's intensity.")).toBeInTheDocument();
  });
});

function checklist(over: Partial<ChecklistProgress> = {}): ChecklistProgress {
  return {
    items: [
      { id: "c1", item: "Review inbox", completed: false, required: true },
      { id: "c2", item: "Pack laptop", completed: true, required: false },
    ],
    completed: 1,
    total: 2,
    requiredRemaining: 1,
    percent: 50,
    allRequiredDone: false,
    ...over,
  };
}

describe("TomorrowChecklist", () => {
  it("renders items + progress", () => {
    render(<TomorrowChecklist checklist={checklist()} onToggle={vi.fn()} />);
    expect(screen.getByText("Review inbox")).toBeInTheDocument();
    expect(screen.getByText("1/2 done")).toBeInTheDocument();
    expect(screen.getByText("1 required left")).toBeInTheDocument();
  });
  it("shows ready when required done", () => {
    render(
      <TomorrowChecklist
        checklist={checklist({ requiredRemaining: 0, allRequiredDone: true })}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
  it("toggles an item", async () => {
    const onToggle = vi.fn();
    render(<TomorrowChecklist checklist={checklist()} onToggle={onToggle} />);
    await userEvent.click(screen.getByText("Review inbox"));
    expect(onToggle).toHaveBeenCalled();
  });
});

describe("StudioStepper + StudioProgress", () => {
  it("renders all eight steps + highlights the active", () => {
    render(<StudioStepper current="priorities" onStep={vi.fn()} />);
    expect(screen.getByText("Today's Review")).toBeInTheDocument();
    const active = screen.getByText("Choose Priorities").closest("button");
    expect(active).toHaveAttribute("aria-current", "step");
  });
  it("jumps to a step on click", async () => {
    const onStep = vi.fn();
    render(<StudioStepper current="priorities" onStep={onStep} />);
    await userEvent.click(screen.getByText("Today's Review"));
    expect(onStep).toHaveBeenCalledWith("review");
  });
  it("shows step position + percent", () => {
    render(<StudioProgress current="review" />);
    expect(screen.getByText("Step 1 of 8")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
  it("progress advances with the step", () => {
    render(<StudioProgress current="finalize" />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
