import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makePlan, makeRun, PIPELINE_KINDS } from "@myos/core/orchestration";
import type { OrchestrationFailure } from "@myos/core/orchestration";
import { ExecutionGraph } from "./ExecutionGraph";
import { ExecutionPreview } from "./ExecutionPreview";
import { PipelineView } from "./PipelineView";
import { RunHistory } from "./RunHistory";
import { OrchestrationInspector } from "./OrchestrationInspector";
import { RecoveryView } from "./RecoveryView";
import { SummaryView } from "./SummaryView";
import { StatisticsView } from "./StatisticsView";
import {
  MODE_LABEL,
  MODULE_ICON,
  MODULE_LABEL,
  PIPELINE_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  STRATEGY_LABEL,
} from "./orchestration-icons";

describe("orchestration-icons", () => {
  it("has an icon + label for every module", () => {
    expect(Object.keys(MODULE_ICON)).toHaveLength(15);
    expect(Object.keys(MODULE_LABEL)).toHaveLength(15);
    expect(MODULE_LABEL.calendar).toBe("Calendar");
  });
  it("labels every pipeline kind", () => {
    for (const kind of PIPELINE_KINDS) expect(PIPELINE_LABEL[kind]).toBeTruthy();
  });
  it("maps status badges + labels", () => {
    expect(STATUS_BADGE.completed).toBe("success");
    expect(STATUS_BADGE.failed).toBe("danger");
    expect(STATUS_LABEL.recovered).toBe("Recovered");
  });
  it("labels modes + strategies", () => {
    expect(MODE_LABEL.regenerate).toBe("Regenerate");
    expect(STRATEGY_LABEL.retry_step).toBe("Retry step");
    expect(STRATEGY_LABEL.skip_downstream).toBe("Skip downstream");
  });
});

describe("ExecutionGraph", () => {
  const plan = makePlan();

  it("renders every step module in order", () => {
    render(<ExecutionGraph steps={plan.order} />);
    for (const step of plan.order) {
      expect(screen.getAllByText(MODULE_LABEL[step.module]).length).toBeGreaterThan(0);
    }
  });

  it("dims skipped modules", () => {
    const { container } = render(
      <ExecutionGraph steps={plan.order} skipped={[plan.order[1]!.module]} />,
    );
    expect(container.querySelector(".opacity-40")).toBeTruthy();
  });

  it("renders a mode badge for the first step", () => {
    render(<ExecutionGraph steps={plan.order} />);
    expect(screen.getAllByText(MODE_LABEL[plan.order[0]!.mode]).length).toBeGreaterThan(0);
  });
});

describe("ExecutionPreview", () => {
  it("shows the pipeline label, preview badge + affected count", () => {
    const plan = makePlan();
    render(<ExecutionPreview plan={plan} />);
    expect(screen.getByText(PIPELINE_LABEL[plan.pipeline])).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText(`${plan.affected.length} affected`)).toBeInTheDocument();
  });

  it("lists skipped modules when present", () => {
    const plan = makePlan({ skipped: ["notification"] });
    render(<ExecutionPreview plan={plan} />);
    expect(screen.getByText(/Skipped:/)).toBeInTheDocument();
  });
});

describe("PipelineView", () => {
  it("renders a card for every pipeline", () => {
    render(<PipelineView onRun={vi.fn()} onPreview={vi.fn()} pending={false} />);
    for (const kind of PIPELINE_KINDS) {
      expect(screen.getAllByText(PIPELINE_LABEL[kind]).length).toBeGreaterThan(0);
    }
  });

  it("fires onRun + onPreview with the trigger event", async () => {
    const onRun = vi.fn();
    const onPreview = vi.fn();
    render(<PipelineView onRun={onRun} onPreview={onPreview} pending={false} />);
    await userEvent.click(screen.getAllByRole("button", { name: /Run/ })[0]!);
    await userEvent.click(screen.getAllByRole("button", { name: /Preview/ })[0]!);
    expect(onRun).toHaveBeenCalledWith("calendar.meeting_added");
    expect(onPreview).toHaveBeenCalledWith("calendar.meeting_added");
  });

  it("disables run buttons when pending", () => {
    render(<PipelineView onRun={vi.fn()} onPreview={vi.fn()} pending />);
    expect(screen.getAllByRole("button", { name: /Run/ })[0]).toBeDisabled();
  });
});

describe("RunHistory", () => {
  it("shows an empty state with no runs", () => {
    render(<RunHistory runs={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("No runs yet")).toBeInTheDocument();
  });

  it("lists runs with pipeline + status", () => {
    const run = makeRun({ status: "recovered", recoveries: 1 });
    render(<RunHistory runs={[run]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText(PIPELINE_LABEL[run.pipeline])).toBeInTheDocument();
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    expect(screen.getByText(/recovered/)).toBeInTheDocument();
  });

  it("fires onSelect when a run is clicked", async () => {
    const onSelect = vi.fn();
    const run = makeRun();
    render(<RunHistory runs={[run]} selectedId={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByText(PIPELINE_LABEL[run.pipeline]));
    expect(onSelect).toHaveBeenCalledWith(run.id);
  });
});

describe("OrchestrationInspector", () => {
  it("renders the run summary + each step", () => {
    const run = makeRun();
    render(<OrchestrationInspector run={run} />);
    expect(screen.getByText(run.summary)).toBeInTheDocument();
    expect(screen.getByText(STATUS_LABEL[run.status])).toBeInTheDocument();
    for (const step of run.steps) {
      expect(screen.getAllByText(MODULE_LABEL[step.module]).length).toBeGreaterThan(0);
    }
  });

  it("shows the recovery strategy badge on a recovered step", () => {
    const run = makeRun({
      status: "recovered",
      steps: [
        {
          module: "planner",
          outcome: "recovered",
          mode: "regenerate",
          runtimeMs: 5,
          recovery: "retry_step",
        },
      ],
    });
    render(<OrchestrationInspector run={run} />);
    expect(screen.getByText("Retry step")).toBeInTheDocument();
  });
});

describe("RecoveryView", () => {
  it("shows an empty state with no failures or recovery", () => {
    render(<RecoveryView failures={[]} recovery={[]} />);
    expect(screen.getByText("No recovery needed")).toBeInTheDocument();
  });

  it("renders recovery decisions", () => {
    render(
      <RecoveryView
        failures={[]}
        recovery={[
          { id: "r1", module: "planner", strategy: "retry_step", reason: "Retrying planner." },
        ]}
      />,
    );
    expect(screen.getByText("Retry step")).toBeInTheDocument();
    expect(screen.getByText("Retrying planner.")).toBeInTheDocument();
  });

  it("renders failures with a recovered/failed badge", () => {
    const failures: OrchestrationFailure[] = [
      { module: "calendar", error: "sync down", strategy: "skip_downstream", recovered: true },
    ];
    render(<RecoveryView failures={failures} recovery={[]} />);
    expect(screen.getByText("sync down")).toBeInTheDocument();
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});

describe("SummaryView", () => {
  it("shows system ready + counts", () => {
    render(
      <SummaryView
        summary={{
          status: "completed",
          lastRunAt: null,
          runsToday: 3,
          failuresToday: 0,
          recoveriesToday: 1,
          affectedModulesLastRun: 5,
          systemReady: true,
        }}
      />,
    );
    expect(screen.getByText("System ready")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows attention needed when not ready", () => {
    render(
      <SummaryView
        summary={{
          status: "failed",
          lastRunAt: null,
          runsToday: 1,
          failuresToday: 1,
          recoveriesToday: 0,
          affectedModulesLastRun: 2,
          systemReady: false,
        }}
      />,
    );
    expect(screen.getByText("Attention needed")).toBeInTheDocument();
  });
});

describe("StatisticsView", () => {
  const stats = {
    totalRuns: 10,
    runsToday: 3,
    fullRuns: 2,
    failedRuns: 1,
    recoveredRuns: 2,
    avgRuntimeMs: 120,
    byPipeline: [
      { pipeline: "calendar", runs: 5, failures: 1 },
      { pipeline: "health", runs: 3, failures: 0 },
    ],
  };

  it("renders totals", () => {
    render(<StatisticsView statistics={stats} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("120ms")).toBeInTheDocument();
  });

  it("renders the per-pipeline breakdown", () => {
    render(<StatisticsView statistics={stats} />);
    expect(screen.getByText(PIPELINE_LABEL.calendar)).toBeInTheDocument();
    expect(screen.getByText("5 runs")).toBeInTheDocument();
    expect(screen.getByText("1 failed")).toBeInTheDocument();
  });

  it("omits the breakdown when empty", () => {
    render(<StatisticsView statistics={{ ...stats, byPipeline: [] }} />);
    expect(screen.queryByText("By pipeline")).not.toBeInTheDocument();
  });
});
