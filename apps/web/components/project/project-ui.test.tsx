import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  BurndownPoint,
  Forecast,
  Milestone,
  Objective,
  PortfolioSummary,
  Project,
} from "@myos/core/project";
import { ProgressRing } from "./ProgressRing";
import { HealthIndicator } from "./HealthIndicator";
import { ProjectStatusIndicator } from "./ProjectStatusIndicator";
import { ProjectCard } from "./ProjectCard";
import { ProjectList } from "./ProjectList";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneList } from "./MilestoneList";
import { ObjectiveSection } from "./ObjectiveSection";
import { ForecastPanel } from "./ForecastPanel";
import { BurndownChart } from "./BurndownChart";
import { DependencyView } from "./DependencyView";
import { ProjectTimeline } from "./ProjectTimeline";
import { Roadmap } from "./Roadmap";
import { PortfolioOverview } from "./PortfolioOverview";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectSearch } from "./ProjectSearch";

const iso = (y: number, mo: number, d: number) => new Date(Date.UTC(y, mo, d)).toISOString();

function project(over: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Campus AI",
    description: "An assistant",
    status: "active",
    priority: "high",
    color: "blue",
    owner: "",
    startDate: iso(2026, 6, 1),
    targetDate: iso(2026, 8, 1),
    completedAt: null,
    createdAt: iso(2026, 6, 1),
    updatedAt: iso(2026, 6, 1),
    milestones: [],
    objectives: [],
    dependencies: [],
    ...over,
  };
}

function milestone(over: Partial<Milestone> = {}): Milestone {
  return {
    id: "m1",
    projectId: "p1",
    title: "Alpha",
    description: "",
    dueDate: iso(2026, 6, 20),
    completed: false,
    order: 0,
    ...over,
  };
}

function objective(over: Partial<Objective> = {}): Objective {
  return {
    id: "o1",
    projectId: "p1",
    title: "Ship features",
    targetValue: 10,
    currentValue: 5,
    unit: "features",
    completed: false,
    ...over,
  };
}

describe("ProgressRing", () => {
  it("renders a clamped percentage label", () => {
    render(<ProgressRing value={150} />);
    expect(screen.getByLabelText("100% complete")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows a custom label when provided", () => {
    render(<ProgressRing value={42} label="42d" />);
    expect(screen.getByText("42d")).toBeInTheDocument();
  });
});

describe("HealthIndicator", () => {
  it("renders the health label", () => {
    render(<HealthIndicator status="at_risk" />);
    expect(screen.getByText("At risk")).toBeInTheDocument();
  });

  it("hides the label when showLabel is false", () => {
    render(<HealthIndicator status="healthy" showLabel={false} />);
    expect(screen.queryByText("Healthy")).not.toBeInTheDocument();
  });
});

describe("ProjectStatusIndicator", () => {
  it("renders the status label", () => {
    render(<ProjectStatusIndicator status="on_hold" />);
    expect(screen.getByText("On hold")).toBeInTheDocument();
  });

  it("renders the completed status", () => {
    render(<ProjectStatusIndicator status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});

describe("ProjectCard", () => {
  it("renders name + description and selects on click", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ProjectCard project={project()} selected={false} onSelect={onSelect} />);
    expect(screen.getByText("Campus AI")).toBeInTheDocument();
    expect(screen.getByText("An assistant")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("marks the selected card via aria-pressed", () => {
    render(<ProjectCard project={project()} selected onSelect={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ProjectList", () => {
  it("shows an empty state with no projects", () => {
    render(<ProjectList projects={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });

  it("renders one card per project", () => {
    render(
      <ProjectList
        projects={[project({ id: "a", name: "A" }), project({ id: "b", name: "B" })]}
        selectedId="a"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("MilestoneCard", () => {
  it("renders title and completes", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<MilestoneCard milestone={milestone()} onComplete={onComplete} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /complete/i }));
    expect(onComplete).toHaveBeenCalledWith("m1");
  });

  it("hides the complete button for a completed milestone", () => {
    render(<MilestoneCard milestone={milestone({ completed: true })} onComplete={() => {}} />);
    expect(screen.queryByRole("button", { name: /complete/i })).not.toBeInTheDocument();
  });

  it("flags an overdue milestone", () => {
    render(<MilestoneCard milestone={milestone()} overdue />);
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });
});

describe("MilestoneList", () => {
  it("empty message with no milestones", () => {
    render(<MilestoneList projectId="p1" milestones={[]} />);
    expect(screen.getByText("No milestones yet.")).toBeInTheDocument();
  });

  it("adds a milestone via the inline form", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<MilestoneList projectId="p1" milestones={[]} onCreate={onCreate} />);
    await user.type(screen.getByPlaceholderText("Add a milestone…"), "Beta");
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(onCreate).toHaveBeenCalledWith({ projectId: "p1", title: "Beta" });
  });

  it("renders existing milestones in order", () => {
    render(
      <MilestoneList
        projectId="p1"
        milestones={[
          milestone({ id: "m2", title: "Second", order: 1 }),
          milestone({ id: "m1", title: "First", order: 0 }),
        ]}
      />,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});

describe("ObjectiveSection", () => {
  it("renders an objective with its value", () => {
    render(<ObjectiveSection projectId="p1" objectives={[objective()]} />);
    expect(screen.getByText("Ship features")).toBeInTheDocument();
    expect(screen.getByText(/5\/10 features/)).toBeInTheDocument();
  });

  it("updates the current value via the slider", () => {
    const onUpdate = vi.fn();
    render(<ObjectiveSection projectId="p1" objectives={[objective()]} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByLabelText("Update Ship features"), { target: { value: "8" } });
    expect(onUpdate).toHaveBeenCalledWith("o1", 8);
  });
});

describe("ForecastPanel", () => {
  const forecast: Forecast = {
    velocityPerDay: 0.3,
    remainingTasks: 4,
    estimatedCompletion: "2026-07-30",
    confidence: 80,
    onTrack: false,
    bufferDays: 2,
    predictedDelayDays: 5,
  };

  it("renders forecast metrics and delay badge", () => {
    render(<ForecastPanel forecast={forecast} />);
    expect(screen.getByText("Forecast")).toBeInTheDocument();
    expect(screen.getByText("0.3/day")).toBeInTheDocument();
    expect(screen.getByText("+5d delay")).toBeInTheDocument();
  });

  it("shows an on-track badge", () => {
    render(<ForecastPanel forecast={{ ...forecast, onTrack: true, predictedDelayDays: 0 }} />);
    expect(screen.getByText("On track")).toBeInTheDocument();
  });
});

describe("BurndownChart", () => {
  const points: BurndownPoint[] = [
    { date: "2026-07-01", remaining: 4, ideal: 4 },
    { date: "2026-07-02", remaining: 3, ideal: 3 },
    { date: "2026-07-03", remaining: 1, ideal: 2 },
  ];

  it("renders an svg chart with enough points", () => {
    render(<BurndownChart points={points} />);
    expect(screen.getByRole("img", { name: "Burndown chart" })).toBeInTheDocument();
  });

  it("shows a fallback with too little history", () => {
    render(<BurndownChart points={points.slice(0, 1)} />);
    expect(screen.getByText(/Not enough history/)).toBeInTheDocument();
  });
});

describe("DependencyView", () => {
  it("lists upstream dependencies", () => {
    render(
      <DependencyView
        projectId="p1"
        dependencies={[{ projectId: "p1", dependsOn: "p2" }]}
        projects={[project({ id: "p1" }), project({ id: "p2", name: "Infra" })]}
      />,
    );
    expect(screen.getByText("Infra")).toBeInTheDocument();
  });

  it("shows a no-dependency message", () => {
    render(<DependencyView projectId="p1" dependencies={[]} projects={[project()]} />);
    expect(screen.getByText(/No dependencies/)).toBeInTheDocument();
  });
});

describe("ProjectTimeline", () => {
  it("renders milestones chronologically", () => {
    render(
      <ProjectTimeline
        project={project({
          milestones: [
            milestone({ id: "m2", title: "Beta", dueDate: iso(2026, 7, 1) }),
            milestone({ id: "m1", title: "Alpha", dueDate: iso(2026, 6, 15) }),
          ],
        })}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("prompts to add milestones when empty", () => {
    render(<ProjectTimeline project={project()} />);
    expect(screen.getByText(/Add milestones/)).toBeInTheDocument();
  });
});

describe("Roadmap", () => {
  it("groups milestones by quarter", () => {
    render(
      <Roadmap
        projects={[project({ milestones: [milestone({ id: "m1", dueDate: iso(2026, 6, 15) })] })]}
      />,
    );
    expect(screen.getByText("2026 Q3")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("shows an empty roadmap state", () => {
    render(<Roadmap projects={[project()]} />);
    expect(screen.getByText("No roadmap yet")).toBeInTheDocument();
  });
});

describe("PortfolioOverview", () => {
  const summary: PortfolioSummary = {
    projectCount: 8,
    activeCount: 6,
    overallCompletion: 74,
    healthDistribution: { healthy: 4, at_risk: 2, behind: 0, blocked: 0, completed: 2 },
    atRiskCount: 2,
    openMilestones: 14,
    blockedTasks: 1,
    upcomingDeadlines: [{ projectId: "p1", title: "Ship v1", dueDate: iso(2026, 6, 20) }],
  };

  it("renders headline metrics", () => {
    render(<PortfolioOverview summary={summary} />);
    expect(screen.getByText("74%")).toBeInTheDocument();
    expect(screen.getByText("Ship v1")).toBeInTheDocument();
  });

  it("shows the health distribution", () => {
    render(<PortfolioOverview summary={summary} />);
    expect(screen.getByText(/Healthy · 4/)).toBeInTheDocument();
  });

  it("shows project and active counts", () => {
    render(<PortfolioOverview summary={summary} />);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});

describe("ProjectFilters", () => {
  it("toggles a status filter", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ProjectFilters value={null} onChange={onChange} />);
    await user.click(screen.getByText("Active"));
    expect(onChange).toHaveBeenCalledWith("active");
  });

  it("clears the filter when the active chip is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ProjectFilters value="active" onChange={onChange} />);
    await user.click(screen.getByText("Active"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("ProjectSearch", () => {
  it("emits typed input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ProjectSearch value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("Search projects"), "AI");
    expect(onChange).toHaveBeenCalled();
  });
});
