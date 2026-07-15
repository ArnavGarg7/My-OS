import { describe, expect, it } from "vitest";
import {
  MODULE_DEPENDENCIES,
  ORCHESTRATION_MODULES,
  PIPELINE_KINDS,
  RECOVERY_STRATEGIES,
  type OrchestrationModule,
} from "../constants";
import { PIPELINES, PIPELINE_TRIGGERS, pipelineForEvent } from "../pipeline";
import { buildPlan } from "../execution-plan";
import { affectedModules, topologicalOrder, subgraph } from "../dependency-graph";
import { DEFAULT_RECOVERY, decideRecovery, isRecoverable } from "../recovery";
import { validatePlan } from "../validation";
import { makeContext } from "../fixtures";

const ctx = makeContext();

describe("every pipeline builds a valid plan", () => {
  for (const pipeline of PIPELINE_KINDS) {
    it(`${pipeline} pipeline plans + validates`, () => {
      const event = PIPELINE_TRIGGERS[pipeline][0]!;
      const plan = buildPlan(pipeline, event, ctx);
      expect(plan.order.length).toBe(PIPELINES[pipeline].length);
      expect(plan.order[plan.order.length - 1]?.module).toBe("analytics");
      expect(validatePlan(plan).valid).toBe(true);
    });
  }
});

describe("every pipeline resolves from all its triggers", () => {
  for (const pipeline of PIPELINE_KINDS) {
    for (const event of PIPELINE_TRIGGERS[pipeline]) {
      it(`${event} → ${pipeline}`, () => {
        expect(pipelineForEvent(event)).toBe(pipeline);
      });
    }
  }
});

describe("every module has a recovery strategy + decision", () => {
  const plan = buildPlan("calendar", "calendar.meeting_added", ctx);
  for (const module of ORCHESTRATION_MODULES) {
    it(`${module} recovery`, () => {
      expect(DEFAULT_RECOVERY[module]).toBeDefined();
      const d = decideRecovery(module, plan, 0);
      expect(RECOVERY_STRATEGIES).toContain(d.strategy);
      expect(typeof d.reason).toBe("string");
    });
  }
});

describe("every recovery strategy is recoverable except abort", () => {
  for (const strategy of RECOVERY_STRATEGIES) {
    it(`${strategy}`, () => {
      expect(isRecoverable(strategy)).toBe(strategy !== "abort");
    });
  }
});

describe("affected sets terminate at analytics", () => {
  for (const module of ORCHESTRATION_MODULES) {
    it(`${module} → analytics (unless analytics itself)`, () => {
      const affected = affectedModules(module as OrchestrationModule);
      if (module === "analytics") {
        expect(affected).toEqual([]);
      } else {
        expect(affected).toContain("analytics");
      }
    });
  }
});

describe("full-graph topological order is acyclic", () => {
  it("orders all modules without a cycle", () => {
    const nodes = [...ORCHESTRATION_MODULES];
    const order = topologicalOrder(nodes, subgraph(nodes, MODULE_DEPENDENCIES));
    expect(order).toHaveLength(nodes.length);
    // calendar (a root) before analytics (the sink)
    expect(order.indexOf("calendar")).toBeLessThan(order.indexOf("analytics"));
  });
});

describe("plan modes never regenerate in health/goal/inbox planner steps", () => {
  for (const pipeline of ["health", "goal", "inbox"] as const) {
    it(`${pipeline} planner step is recommend`, () => {
      const step = PIPELINES[pipeline].find((s) => s.module === "planner");
      if (step) expect(step.mode).toBe("recommend");
    });
  }
});
