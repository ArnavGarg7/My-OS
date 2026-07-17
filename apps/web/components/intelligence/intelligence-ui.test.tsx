import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  buildDashboard,
  executiveSummary,
  lifeAreas,
  milestones,
  priorityMatrix,
  scorecards,
  trends,
  wheelOfLife,
  achievements,
  makeAchievementInput,
  makeCollection,
  makeInput,
  makeMilestone,
  makeTroubledInput,
  lifeBalance,
  FIXED_NOW,
} from "@myos/core/intelligence";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { AttentionPanel } from "./AttentionPanel";
import { LifeAreas } from "./LifeAreas";
import { Scorecards } from "./Scorecards";
import { Trends } from "./Trends";
import { PriorityMatrix } from "./PriorityMatrix";
import { WheelOfLife } from "./WheelOfLife";
import { Milestones } from "./Milestones";
import { Achievements } from "./Achievements";
import { Reviews } from "./Reviews";
import { Reports } from "./Reports";
import { Collections } from "./Collections";
import { DashboardSettings } from "./DashboardSettings";

describe("ExecutiveSummary — structured, never prose", () => {
  it("renders owned numbers and the overall band", () => {
    render(<ExecutiveSummary summary={executiveSummary(makeInput())} />);
    expect(screen.getByText("Today's snapshot")).toBeInTheDocument();
    expect(screen.getByText(/on track/)).toBeInTheDocument();
  });

  it("says a clear day when nothing needs attention", () => {
    // A fully-clean input: no flashcards due, no slipping goals, nothing at risk.
    const clean = makeInput({
      learning: {
        coursesActive: 3,
        flashcardsDue: 0,
        booksReading: 2,
        learningScore: 70,
        previousScore: 68,
      },
    });
    render(<ExecutiveSummary summary={executiveSummary(clean)} />);
    expect(screen.getByText(/clear day/)).toBeInTheDocument();
  });

  it("surfaces the top attention on a troubled input", () => {
    render(<ExecutiveSummary summary={executiveSummary(makeTroubledInput())} />);
    expect(screen.getByText(/Needs attention:/)).toBeInTheDocument();
  });
});

describe("AttentionPanel — explainable", () => {
  it("shows the empty state when clear", () => {
    render(<AttentionPanel items={[]} />);
    expect(screen.getByText("Nothing needs attention")).toBeInTheDocument();
  });

  it("lists items with their reasons, worst first", () => {
    const dash = buildDashboard(makeTroubledInput());
    render(<AttentionPanel items={dash.attention} />);
    expect(screen.getAllByText(/off-track|running out|renewal|budget/i).length).toBeGreaterThan(0);
  });
});

describe("LifeAreas + Scorecards + Trends", () => {
  it("renders all eight areas", () => {
    render(<LifeAreas areas={lifeAreas(makeInput())} />);
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Personal Growth")).toBeInTheDocument();
  });

  it("renders six scorecards", () => {
    render(<Scorecards cards={scorecards(makeInput())} />);
    // "Productivity" appears as the card heading and as a metric row within it.
    expect(screen.getAllByText("Productivity").length).toBeGreaterThan(0);
    expect(screen.getByText("Relationships")).toBeInTheDocument();
    expect(screen.getByText("Personal Growth")).toBeInTheDocument();
  });

  it("renders trend rows", () => {
    render(<Trends trends={trends(makeInput())} />);
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("Readiness")).toBeInTheDocument();
  });
});

describe("WheelOfLife — pure SVG re-projection", () => {
  it("draws a radar labelled with the areas", () => {
    render(<WheelOfLife slices={wheelOfLife(lifeBalance(makeInput()).areas)} />);
    expect(screen.getByRole("img", { name: "Wheel of Life" })).toBeInTheDocument();
    expect(screen.getByText("Wellbeing")).toBeInTheDocument();
  });
});

describe("PriorityMatrix", () => {
  it("renders the four quadrants", () => {
    render(<PriorityMatrix items={priorityMatrix(makeTroubledInput())} />);
    expect(screen.getByText("DO NOW")).toBeInTheDocument();
    expect(screen.getByText("WATCH")).toBeInTheDocument();
  });
});

describe("Milestones + Achievements", () => {
  it("shows the milestone empty state", () => {
    render(<Milestones milestones={[]} />);
    expect(screen.getByText("No milestones yet")).toBeInTheDocument();
  });

  it("renders milestones with derived status", () => {
    const views = milestones([makeMilestone({ date: "2020-01-01" })], FIXED_NOW);
    render(<Milestones milestones={views} />);
    expect(screen.getByText("overdue")).toBeInTheDocument();
  });

  it("renders unlocked and locked achievements", () => {
    render(<Achievements achievements={achievements(makeAchievementInput(), FIXED_NOW)} />);
    expect(screen.getAllByText("Unlocked").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
  });
});

describe("Reviews + Reports — generate from read models", () => {
  it("generates a review for a period", async () => {
    const onGenerate = vi.fn();
    render(<Reviews reviews={[]} onGenerate={onGenerate} />);
    await userEvent.click(screen.getByRole("button", { name: "weekly" }));
    expect(onGenerate).toHaveBeenCalledWith("weekly");
  });

  it("generates a report for a period", async () => {
    const onGenerate = vi.fn();
    render(<Reports reports={[]} onGenerate={onGenerate} />);
    await userEvent.click(screen.getByRole("button", { name: "monthly" }));
    expect(onGenerate).toHaveBeenCalledWith("monthly");
  });
});

describe("Collections — reference groupings", () => {
  it("shows the empty state", () => {
    render(<Collections collections={[]} onCreate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("No collections yet")).toBeInTheDocument();
  });

  it("creates a collection", async () => {
    const onCreate = vi.fn();
    render(<Collections collections={[]} onCreate={onCreate} onDelete={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Collection name"), "Semester");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledWith({ name: "Semester" });
  });

  it("shows collection size", () => {
    render(
      <Collections
        collections={[
          makeCollection({ name: "Fitness", entityRefs: [{ module: "goal", id: "g1" }] }),
        ]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Fitness")).toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });
});

describe("DashboardSettings — layout only", () => {
  it("moves a widget and saves the new order", async () => {
    const onSave = vi.fn();
    render(
      <DashboardSettings
        preferences={{
          widgetOrder: ["today", "health", "goals"],
          hiddenWidgets: [],
          updatedAt: "",
        }}
        onSave={onSave}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Move health up" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ widgetOrder: ["health", "today", "goals"] }),
    );
  });

  it("hides a widget", async () => {
    const onSave = vi.fn();
    render(
      <DashboardSettings
        preferences={{ widgetOrder: ["today"], hiddenWidgets: [], updatedAt: "" }}
        onSave={onSave}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ hiddenWidgets: ["today"] }));
  });
});
