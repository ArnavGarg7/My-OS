import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  Goal,
  GoalForecast as Forecast,
  GoalReview,
  Habit,
  KeyResult,
  Objective,
} from "@myos/core/goal";
import { GoalProgress } from "./GoalProgress";
import { GoalForecast } from "./GoalForecast";
import { KeyResultCard } from "./KeyResultCard";
import { ObjectiveCard } from "./ObjectiveCard";
import { HabitCard } from "./HabitCard";
import { GoalHierarchy } from "./GoalHierarchy";
import { GoalReviews } from "./GoalReviews";
import { GoalSearch } from "./GoalSearch";
import { GoalTimeline } from "./GoalTimeline";
import { QuickGoal } from "./QuickGoal";
import { GOAL_TYPE_LABEL, FORECAST_LABEL, STATUS_LABEL } from "./goal-icons";

const at = (mo: number, d: number) => new Date(Date.UTC(2026, mo, d, 12)).toISOString();
const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

function keyResult(over: Partial<KeyResult> = {}): KeyResult {
  return {
    id: "kr1",
    objectiveId: "o1",
    title: "CGPA",
    metricType: "numeric",
    currentValue: 8,
    targetValue: 10,
    unit: "pts",
    status: "active",
    ...over,
  };
}

function objective(over: Partial<Objective> = {}): Objective {
  return {
    id: "o1",
    goalId: "g1",
    title: "Excel academically",
    description: "",
    weight: 1,
    status: "active",
    keyResults: [keyResult()],
    ...over,
  };
}

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    goalId: "g1",
    title: "Study 2h",
    frequency: "daily",
    target: 1,
    currentStreak: 3,
    longestStreak: 5,
    lastCompleted: null,
    active: true,
    history: [daysAgo(0), daysAgo(1), daysAgo(2)],
    ...over,
  };
}

function goal(over: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    title: "Graduate with honours",
    description: "",
    goalType: "education",
    status: "active",
    priority: "high",
    targetDate: at(11, 31),
    startedAt: at(0, 1),
    completedAt: null,
    objectives: [],
    habits: [],
    links: [],
    createdAt: at(0, 1),
    updatedAt: at(0, 1),
    ...over,
  };
}

function forecast(over: Partial<Forecast> = {}): Forecast {
  return {
    velocityPerDay: 0.5,
    estimatedCompletion: at(10, 1),
    status: "on_track",
    projectedProgressAtTarget: 90,
    ...over,
  };
}

function review(over: Partial<GoalReview> = {}): GoalReview {
  return {
    id: "rv1",
    goalId: "g1",
    reviewPeriod: "quarterly",
    summary: "Solid progress this quarter.",
    progressSnapshot: 60,
    reviewedAt: at(2, 25),
    ...over,
  };
}

describe("goal-icons maps", () => {
  it("labels goal types, statuses and forecasts", () => {
    expect(GOAL_TYPE_LABEL.education).toBe("Education");
    expect(STATUS_LABEL.active).toBe("Active");
    expect(FORECAST_LABEL.behind).toBe("Behind");
  });
});

describe("GoalProgress", () => {
  it("renders derived overall progress + objective count", () => {
    render(<GoalProgress goal={goal({ objectives: [objective()] })} />);
    expect(screen.getByText("Overall progress")).toBeInTheDocument();
    // one objective at 80% key result → objectives 80%, blended
    expect(screen.getByText(/objectives/)).toBeInTheDocument();
  });
});

describe("GoalForecast", () => {
  it("renders velocity + status badge", () => {
    render(<GoalForecast forecast={forecast()} />);
    expect(screen.getByText("Forecast")).toBeInTheDocument();
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(screen.getByText(/0.5%\/day/)).toBeInTheDocument();
  });

  it("hides projection when unknown", () => {
    render(<GoalForecast forecast={forecast({ status: "unknown" })} />);
    expect(screen.queryByText(/Projected/)).not.toBeInTheDocument();
  });
});

describe("KeyResultCard", () => {
  it("shows derived percent and current/target", () => {
    render(<KeyResultCard keyResult={keyResult()} />);
    expect(screen.getByText(/8\/10 pts · 80%/)).toBeInTheDocument();
  });

  it("edits value on blur for numeric metrics", async () => {
    const onUpdate = vi.fn();
    render(<KeyResultCard keyResult={keyResult()} onUpdate={onUpdate} />);
    const input = screen.getByLabelText("Update CGPA");
    await userEvent.clear(input);
    await userEvent.type(input, "9");
    await userEvent.tab();
    expect(onUpdate).toHaveBeenCalledWith("kr1", 9);
  });

  it("has no editor for boolean metrics", () => {
    render(<KeyResultCard keyResult={keyResult({ metricType: "boolean" })} onUpdate={vi.fn()} />);
    expect(screen.queryByLabelText("Update CGPA")).not.toBeInTheDocument();
  });
});

describe("ObjectiveCard", () => {
  it("renders objective progress + its key results", () => {
    render(<ObjectiveCard objective={objective()} />);
    expect(screen.getByText("Excel academically")).toBeInTheDocument();
    expect(screen.getByText("CGPA")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });
});

describe("HabitCard", () => {
  it("shows streak + consistency and logs on click", async () => {
    const onComplete = vi.fn();
    render(<HabitCard habit={habit()} onComplete={onComplete} />);
    expect(screen.getByText(/Daily · 3-day streak/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Log/ }));
    expect(onComplete).toHaveBeenCalledWith("h1");
  });

  it("disables the button when already done today", () => {
    render(<HabitCard habit={habit({ lastCompleted: today })} onComplete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Done/ })).toBeDisabled();
  });
});

describe("GoalHierarchy", () => {
  it("shows the strategic chain and objectives", () => {
    render(<GoalHierarchy goal={goal({ objectives: [objective()] })} />);
    expect(screen.getByText("Education goal")).toBeInTheDocument();
    expect(screen.getByText("1 objectives")).toBeInTheDocument();
    expect(screen.getByText("1 key results")).toBeInTheDocument();
  });

  it("prompts to add objectives when empty", () => {
    render(<GoalHierarchy goal={goal()} />);
    expect(screen.getByText(/make this goal measurable/)).toBeInTheDocument();
  });
});

describe("GoalReviews", () => {
  it("lists reviews and offers period buttons", async () => {
    const onCreate = vi.fn();
    render(<GoalReviews reviews={[review()]} onCreate={onCreate} />);
    expect(screen.getByText("Solid progress this quarter.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /weekly review/ }));
    expect(onCreate).toHaveBeenCalledWith("weekly");
  });

  it("shows empty state without reviews", () => {
    render(<GoalReviews reviews={[]} />);
    expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
  });
});

describe("GoalSearch", () => {
  it("emits changes", async () => {
    const onChange = vi.fn();
    render(<GoalSearch value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Search goals"), "grad");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("GoalTimeline", () => {
  it("charts objectives with derived percent", () => {
    render(<GoalTimeline goal={goal({ objectives: [objective()] })} />);
    expect(screen.getByText("Excel academically")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("prompts when no objectives", () => {
    render(<GoalTimeline goal={goal()} />);
    expect(screen.getByText(/Add objectives to chart/)).toBeInTheDocument();
  });
});

describe("QuickGoal", () => {
  it("parses a one-line capture into a goal", async () => {
    const onCreate = vi.fn();
    render(<QuickGoal onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Quick goal"), "Graduate by 2027 #education");
    await userEvent.click(screen.getByRole("button", { name: /Add/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    const arg = onCreate.mock.calls[0]![0];
    expect(arg.goalType).toBe("education");
    expect(arg.title).toContain("Graduate");
  });

  it("does not submit empty input", async () => {
    const onCreate = vi.fn();
    render(<QuickGoal onCreate={onCreate} />);
    expect(screen.getByRole("button", { name: /Add/ })).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
