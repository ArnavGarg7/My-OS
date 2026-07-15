import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeRule, makeRecord } from "@myos/core/automation";
import type { AutomationPreview as Preview } from "@myos/core/automation";
import { AutomationCard } from "./AutomationCard";
import { AutomationList } from "./AutomationList";
import { AutomationFilters } from "./AutomationFilters";
import { TriggerEditor } from "./TriggerEditor";
import { ConditionBuilder } from "./ConditionBuilder";
import { ActionBuilder } from "./ActionBuilder";
import { ExecutionPolicyEditor } from "./ExecutionPolicyEditor";
import { AutomationPreview } from "./AutomationPreview";
import { AutomationHistory } from "./AutomationHistory";
import { AutomationStatistics } from "./AutomationStatistics";
import { AutomationEditor } from "./AutomationEditor";
import { PRIORITY_BADGE, STATUS_LABEL, TRIGGER_ICON, actionLabel } from "./automation-icons";

describe("automation-icons", () => {
  it("has an icon for every trigger kind", () => {
    expect(Object.keys(TRIGGER_ICON)).toHaveLength(17);
  });
  it("maps status + priority", () => {
    expect(STATUS_LABEL.enabled).toBe("Enabled");
    expect(PRIORITY_BADGE.critical).toBe("danger");
  });
  it("humanizes action kinds", () => {
    expect(actionLabel("generate_notification")).toBe("Generate Notification");
  });
});

describe("AutomationCard", () => {
  const rule = makeRule({ name: "My rule", status: "enabled", priority: "high" });

  it("renders name, status, priority + trigger summary", () => {
    render(
      <AutomationCard
        rule={rule}
        selected={false}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("My rule")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText(/planner/)).toBeInTheDocument();
  });

  it("fires run + toggle", async () => {
    const onExecute = vi.fn();
    const onToggle = vi.fn();
    render(
      <AutomationCard
        rule={rule}
        selected={false}
        onSelect={vi.fn()}
        onToggle={onToggle}
        onExecute={onExecute}
        onDelete={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Run"));
    await userEvent.click(screen.getByText("Disable"));
    expect(onExecute).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows Enable when disabled", () => {
    render(
      <AutomationCard
        rule={makeRule({ status: "disabled" })}
        selected={false}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Enable")).toBeInTheDocument();
  });

  it("hides delete for built-in rules", () => {
    render(
      <AutomationCard
        rule={makeRule({ builtIn: true })}
        selected={false}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(screen.getByText("Built-in")).toBeInTheDocument();
  });
});

describe("AutomationList", () => {
  it("renders rules", () => {
    render(
      <AutomationList
        rules={[makeRule({ id: "a", name: "One" }), makeRule({ id: "b", name: "Two" })]}
        selectedId="a"
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });
  it("empty state", () => {
    render(
      <AutomationList
        rules={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/No automations yet/)).toBeInTheDocument();
  });
  it("selects a rule", async () => {
    const onSelect = vi.fn();
    render(
      <AutomationList
        rules={[makeRule({ id: "a", name: "One" })]}
        selectedId={null}
        onSelect={onSelect}
        onToggle={vi.fn()}
        onExecute={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("One"));
    expect(onSelect).toHaveBeenCalledWith("a");
  });
});

describe("AutomationFilters", () => {
  it("renders + fires", async () => {
    const onChange = vi.fn();
    render(<AutomationFilters view="all" onChange={onChange} />);
    for (const l of ["All", "Enabled", "Built-in", "Custom"])
      expect(screen.getByText(l)).toBeInTheDocument();
    await userEvent.click(screen.getByText("Built-in"));
    expect(onChange).toHaveBeenCalledWith("built-in");
  });
});

describe("editor sections", () => {
  it("TriggerEditor shows the trigger", () => {
    render(<TriggerEditor kind="calendar" event="calendar.meeting_started" />);
    expect(screen.getByText("When")).toBeInTheDocument();
    expect(screen.getByText(/calendar.meeting_started/)).toBeInTheDocument();
  });
  it("ConditionBuilder renders empty as always-passes", () => {
    render(<ConditionBuilder conditions={{ combinator: "and", conditions: [] }} />);
    expect(screen.getByText(/always passes/)).toBeInTheDocument();
  });
  it("ConditionBuilder renders a leaf", () => {
    render(
      <ConditionBuilder
        conditions={{
          combinator: "and",
          conditions: [{ id: "c1", field: "count", operator: "greater_than", value: 5 }],
        }}
      />,
    );
    expect(screen.getByText("count")).toBeInTheDocument();
  });
  it("ActionBuilder lists actions", () => {
    render(<ActionBuilder actions={[{ id: "a1", kind: "start_focus", params: {}, order: 0 }]} />);
    expect(screen.getByText(/Start a focus session/)).toBeInTheDocument();
  });
  it("ExecutionPolicyEditor describes the policy", () => {
    render(<ExecutionPolicyEditor policy={{ policy: "cooldown", cooldownMinutes: 30 }} />);
    expect(screen.getByText(/waits 30 min/)).toBeInTheDocument();
  });
});

describe("AutomationPreview", () => {
  const preview: Preview = {
    triggerMatches: true,
    conditionsPass: true,
    wouldExecute: true,
    actions: [{ kind: "noop", summary: "Do nothing" }],
    expectedResult: "Do nothing",
    reason: "Would execute.",
  };
  it("renders the simulation", () => {
    render(<AutomationPreview preview={preview} />);
    expect(screen.getByText("Trigger matches")).toBeInTheDocument();
    expect(screen.getByText("Would execute")).toBeInTheDocument();
  });
  it("renders a non-match", () => {
    render(
      <AutomationPreview
        preview={{
          ...preview,
          triggerMatches: false,
          wouldExecute: false,
          reason: "Trigger does not match.",
        }}
      />,
    );
    expect(screen.getByText("Trigger no match")).toBeInTheDocument();
  });
});

describe("AutomationHistory", () => {
  it("lists outcomes", () => {
    render(
      <AutomationHistory
        records={[
          makeRecord({ outcome: "completed" }),
          makeRecord({ id: "e2", outcome: "failed" }),
        ]}
      />,
    );
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
  it("empty state", () => {
    render(<AutomationHistory records={[]} />);
    expect(screen.getByText(/No executions yet/)).toBeInTheDocument();
  });
});

describe("AutomationStatistics", () => {
  it("renders portfolio stats", () => {
    render(
      <AutomationStatistics
        portfolio={{
          totalRules: 9,
          enabledRules: 8,
          executionsToday: 3,
          successesToday: 2,
          failuresToday: 1,
          pendingApprovals: 0,
          mostTriggeredRuleId: "r1",
          mostSuccessfulRuleId: "r1",
        }}
      />,
    );
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });
});

describe("AutomationEditor", () => {
  it("creates a rule from the form", async () => {
    const onCreate = vi.fn();
    render(<AutomationEditor onCreate={onCreate} pending={false} />);
    await userEvent.type(screen.getByPlaceholderText(/Meeting/), "My rule");
    await userEvent.click(screen.getByText("Create automation"));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My rule", actions: expect.any(Array) }),
    );
  });
  it("disables create with an empty name", () => {
    render(<AutomationEditor onCreate={vi.fn()} pending={false} />);
    expect(screen.getByText("Create automation").closest("button")).toBeDisabled();
  });
});
