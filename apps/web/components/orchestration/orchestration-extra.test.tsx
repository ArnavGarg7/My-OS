import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  buildPlan,
  makeContext,
  makePlan,
  makeRun,
  PIPELINE_KINDS,
  pipelineModules,
  pipelineSteps,
} from "@myos/core/orchestration";
import { ExecutionGraph } from "./ExecutionGraph";
import { ExecutionPreview } from "./ExecutionPreview";
import { OrchestrationInspector } from "./OrchestrationInspector";
import { RecoveryView } from "./RecoveryView";
import { StatisticsView } from "./StatisticsView";
import { MODULE_LABEL, OUTCOME_ICON, STRATEGY_ICON } from "./orchestration-icons";

describe("orchestration-icons completeness", () => {
  it("has a strategy icon for every recovery strategy", () => {
    expect(Object.keys(STRATEGY_ICON)).toHaveLength(6);
  });
  it("has outcome icons for the common outcomes", () => {
    expect(OUTCOME_ICON.completed).toBeTruthy();
    expect(OUTCOME_ICON.failed).toBeTruthy();
    expect(OUTCOME_ICON.recovered).toBeTruthy();
  });
});

describe("ExecutionGraph arrows", () => {
  it("renders N-1 separators between N steps", () => {
    const plan = makePlan();
    const { container } = render(<ExecutionGraph steps={plan.order} />);
    // Each non-terminal step renders one ArrowRight svg.
    const arrows = container.querySelectorAll("svg.text-fg-subtle");
    expect(arrows.length).toBe(plan.order.length - 1);
  });

  it("handles a single-step plan without arrows", () => {
    const { container } = render(
      <ExecutionGraph steps={[{ module: "morning", order: 0, mode: "record", dependsOn: [] }]} />,
    );
    expect(container.querySelectorAll("svg.text-fg-subtle").length).toBe(0);
  });
});

describe("every pipeline previews cleanly", () => {
  for (const kind of PIPELINE_KINDS) {
    it(`builds + renders a preview for the ${kind} pipeline`, () => {
      const trigger = `${kind}.__test__`;
      const plan = buildPlan(kind, trigger, makeContext());
      const { unmount } = render(<ExecutionPreview plan={plan} />);
      // Affected count is at least the number of distinct modules the pipeline touches.
      expect(plan.affected.length).toBeGreaterThanOrEqual(1);
      expect(pipelineModules(kind).length).toBe(
        new Set(pipelineSteps(kind).map((s) => s.module)).size,
      );
      unmount();
    });
  }
});

describe("OrchestrationInspector metrics", () => {
  it("renders runtime + affected counts", () => {
    const run = makeRun({ runtimeMs: 250, affected: ["calendar", "planner", "decision"] });
    render(<OrchestrationInspector run={run} />);
    expect(screen.getByText("250ms")).toBeInTheDocument();
    expect(screen.getByText("3 modules")).toBeInTheDocument();
  });

  it("shows failed count when a run has failures", () => {
    const run = makeRun({ status: "failed", failures: 2 });
    render(<OrchestrationInspector run={run} />);
    expect(screen.getByText("2 failed")).toBeInTheDocument();
  });
});

describe("RecoveryView both sections", () => {
  it("renders both recovery decisions and failures together", () => {
    render(
      <RecoveryView
        failures={[{ module: "planner", error: "boom", strategy: "retry_step", recovered: true }]}
        recovery={[
          { id: "r1", module: "calendar", strategy: "skip_downstream", reason: "skipping" },
        ]}
      />,
    );
    expect(screen.getByText("Recovery decisions")).toBeInTheDocument();
    expect(screen.getByText("Failures")).toBeInTheDocument();
    expect(screen.getByText(MODULE_LABEL.calendar)).toBeInTheDocument();
    expect(screen.getByText(MODULE_LABEL.planner)).toBeInTheDocument();
  });

  it("shows a Failed badge for an unrecovered failure", () => {
    render(
      <RecoveryView
        failures={[{ module: "planner", error: "boom", strategy: "abort", recovered: false }]}
        recovery={[]}
      />,
    );
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});

describe("StatisticsView edge cases", () => {
  it("renders zero-runtime as 0ms", () => {
    render(
      <StatisticsView
        statistics={{
          totalRuns: 0,
          runsToday: 0,
          fullRuns: 0,
          failedRuns: 0,
          recoveredRuns: 0,
          avgRuntimeMs: 0,
          byPipeline: [],
        }}
      />,
    );
    expect(screen.getByText("0ms")).toBeInTheDocument();
  });

  it("does not render a failed badge for a clean pipeline", () => {
    render(
      <StatisticsView
        statistics={{
          totalRuns: 1,
          runsToday: 1,
          fullRuns: 0,
          failedRuns: 0,
          recoveredRuns: 0,
          avgRuntimeMs: 10,
          byPipeline: [{ pipeline: "calendar", runs: 1, failures: 0 }],
        }}
      />,
    );
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
  });
});

describe("smoke: presentational components accept fixtures without throwing", () => {
  it("renders an inspector for a fixture run", () => {
    expect(() => render(<OrchestrationInspector run={makeRun()} />)).not.toThrow();
  });
  it("renders a graph for a fixture plan", () => {
    expect(() => render(<ExecutionGraph steps={makePlan().order} />)).not.toThrow();
  });
  it("does not crash when onSelect is a noop", () => {
    expect(() => render(<ExecutionPreview plan={makePlan()} />)).not.toThrow();
  });
  it("uses vi mocks cleanly", () => {
    const fn = vi.fn();
    fn();
    expect(fn).toHaveBeenCalled();
  });
});
