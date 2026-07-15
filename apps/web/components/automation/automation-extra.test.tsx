import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeRule, makeRecord } from "@myos/core/automation";
import { ExecutionPolicyEditor } from "./ExecutionPolicyEditor";
import { ConditionBuilder } from "./ConditionBuilder";
import { ActionBuilder } from "./ActionBuilder";
import { AutomationHistory } from "./AutomationHistory";
import { AutomationCard } from "./AutomationCard";
import { OUTCOME_TONE, STATUS_BADGE } from "./automation-icons";

describe("policy descriptions", () => {
  const cases: [Parameters<typeof ExecutionPolicyEditor>[0]["policy"], RegExp][] = [
    [{ policy: "run_once" }, /once, then never/],
    [{ policy: "run_always" }, /every time/],
    [{ policy: "throttle", throttleMinutes: 10 }, /once per 10 min/],
    [{ policy: "max_executions", maxExecutions: 5 }, /up to 5 times/],
    [{ policy: "retry", retryAttempts: 2, retryBackoffMinutes: 5 }, /Retries up to 2/],
    [{ policy: "delay", delayMinutes: 3 }, /Waits 3 min/],
    [{ policy: "schedule", scheduleAt: "09:00" }, /at 09:00/],
    [{ policy: "manual_approval" }, /manual approval/],
  ];
  for (const [policy, re] of cases) {
    it(`describes ${policy.policy}`, () => {
      render(<ExecutionPolicyEditor policy={policy} />);
      expect(screen.getByText(re)).toBeInTheDocument();
    });
  }
});

describe("ConditionBuilder nesting", () => {
  it("renders a nested OR group", () => {
    render(
      <ConditionBuilder
        conditions={{
          combinator: "and",
          conditions: [
            { id: "c1", field: "a", operator: "equals", value: 1 },
            {
              combinator: "or",
              conditions: [{ id: "c2", field: "b", operator: "greater_than", value: 2 }],
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("renders a time condition", () => {
    render(
      <ConditionBuilder
        conditions={{
          combinator: "and",
          conditions: [
            {
              id: "c1",
              field: "",
              operator: "equals",
              value: null,
              timeCondition: "working_hours",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(/working hours/)).toBeInTheDocument();
  });
});

describe("ActionBuilder ordering", () => {
  it("numbers actions in order", () => {
    render(
      <ActionBuilder
        actions={[
          { id: "a1", kind: "pause_focus", params: {}, order: 0 },
          { id: "a2", kind: "resume_focus", params: {}, order: 1 },
        ]}
      />,
    );
    expect(screen.getByText(/Pause the active/)).toBeInTheDocument();
    expect(screen.getByText(/Resume the paused/)).toBeInTheDocument();
  });
});

describe("AutomationHistory formatting", () => {
  it("shows runtime for completed runs", () => {
    render(<AutomationHistory records={[makeRecord({ outcome: "completed", runtimeMs: 1500 })]} />);
    expect(screen.getByText(/1500ms/)).toBeInTheDocument();
  });
  it("renders a skipped outcome", () => {
    render(<AutomationHistory records={[makeRecord({ outcome: "skipped", runtimeMs: null })]} />);
    expect(screen.getByText("skipped")).toBeInTheDocument();
  });
});

describe("icon maps completeness", () => {
  it("status badges for all statuses", () => {
    for (const s of ["created", "enabled", "disabled", "archived"] as const) {
      expect(STATUS_BADGE[s]).toBeTruthy();
    }
  });
  it("outcome tone for common outcomes", () => {
    expect(OUTCOME_TONE.completed).toBe("success");
    expect(OUTCOME_TONE.failed).toBe("danger");
  });
});

describe("AutomationCard selection ring + delete", () => {
  it("fires delete for custom rules", async () => {
    const onDelete = vi.fn();
    render(
      <AutomationCard
        rule={makeRule({ builtIn: false })}
        selected
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalled();
  });
});
