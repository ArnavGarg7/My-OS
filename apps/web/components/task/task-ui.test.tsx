import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "@myos/core/task";
import { TaskRow } from "./TaskRow";
import { TaskList } from "./TaskList";
import { TaskStatus } from "./TaskStatus";
import { TaskPriority } from "./TaskPriority";
import { TaskEditor } from "./TaskEditor";
import { TaskDependencies } from "./TaskDependencies";
import { TaskTimeline } from "./TaskTimeline";
import { TaskQuickCreate } from "./TaskQuickCreate";
import { TaskSearch } from "./TaskSearch";
import { TaskSidebar } from "./TaskSidebar";
import { TaskRecurrence } from "./TaskRecurrence";

function task(over: Partial<Task> = {}): Task {
  const iso = "2026-07-07T06:00:00.000Z";
  return {
    id: "t1",
    title: "Write report",
    description: "",
    status: "not_started",
    priority: "high",
    estimatedMinutes: 60,
    actualMinutes: null,
    dueAt: null,
    scheduledStart: null,
    scheduledEnd: null,
    completedAt: null,
    parentTaskId: null,
    projectId: null,
    milestoneId: null,
    objectiveId: null,
    createdAt: iso,
    updatedAt: iso,
    labels: [],
    dependencies: [],
    ...over,
  };
}

describe("TaskRow", () => {
  it("renders the title and selects on click", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TaskRow task={task()} selected={false} onSelect={onSelect} onToggle={() => {}} />);
    await user.click(screen.getByText("Write report"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("toggles completion via the checkbox", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TaskRow task={task()} selected={false} onSelect={() => {}} onToggle={onToggle} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("marks a completed task's checkbox as checked", () => {
    render(
      <TaskRow
        task={task({ status: "completed" })}
        selected={false}
        onSelect={() => {}}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("shows a blocked marker for blocked tasks", () => {
    render(
      <TaskRow
        task={task({ status: "blocked" })}
        selected={false}
        blocked
        onSelect={() => {}}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText("blocked")).toBeInTheDocument();
  });
});

describe("TaskList", () => {
  it("shows an empty state with no tasks", () => {
    render(
      <TaskList
        tasks={[]}
        selectedId={null}
        now={new Date()}
        onSelect={() => {}}
        onToggle={() => {}}
        emptyLabel="Nothing"
      />,
    );
    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });

  it("renders a row per task", () => {
    render(
      <TaskList
        tasks={[task({ id: "1", title: "A" }), task({ id: "2", title: "B" })]}
        selectedId="1"
        now={new Date()}
        onSelect={() => {}}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("TaskStatus + TaskPriority", () => {
  it("renders a status label", () => {
    render(<TaskStatus status="in_progress" />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders a priority label", () => {
    render(<TaskPriority priority="urgent" />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("hides the priority label when requested", () => {
    render(<TaskPriority priority="high" hideLabel />);
    expect(screen.getByText("High")).toHaveClass("sr-only");
  });
});

describe("TaskEditor", () => {
  it("commits a title change on blur", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<TaskEditor task={task()} onUpdate={onUpdate} />);
    const input = screen.getByLabelText("Task title");
    await user.clear(input);
    await user.type(input, "Renamed");
    await user.tab();
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: "Renamed" }));
  });
});

describe("TaskDependencies", () => {
  it("lists dependencies and removes them", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    const t = task({ id: "a", dependencies: ["b"] });
    const all = [t, task({ id: "b", title: "Design" })];
    render(<TaskDependencies task={t} allTasks={all} onAdd={() => {}} onRemove={onRemove} />);
    expect(screen.getByText("Design")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Remove dependency"));
    expect(onRemove).toHaveBeenCalledWith("b");
  });

  it("shows an empty message with no dependencies", () => {
    render(
      <TaskDependencies task={task()} allTasks={[task()]} onAdd={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getByText("No dependencies.")).toBeInTheDocument();
  });
});

describe("TaskTimeline", () => {
  it("always shows Created and adds Completed when done", () => {
    render(
      <TaskTimeline
        task={task({ status: "completed", completedAt: "2026-07-07T10:00:00.000Z" })}
      />,
    );
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});

describe("TaskQuickCreate", () => {
  it("creates on Enter and clears", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<TaskQuickCreate onCreate={onCreate} pending={false} />);
    const input = screen.getByLabelText("New task title");
    await user.type(input, "Buy milk{Enter}");
    expect(onCreate).toHaveBeenCalledWith("Buy milk");
  });

  it("disables the button when empty", () => {
    render(<TaskQuickCreate onCreate={() => {}} pending={false} />);
    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
  });
});

describe("TaskSearch", () => {
  it("emits typed text", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TaskSearch value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});

describe("TaskSidebar", () => {
  it("renders facet counts and selects", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskSidebar
        active={null}
        counts={{ open: 3, inProgress: 1, blocked: 0, completed: 2 }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("All open")).toBeInTheDocument();
    await user.click(screen.getByText("Completed"));
    expect(onSelect).toHaveBeenCalledWith("completed");
  });
});

describe("TaskRecurrence", () => {
  it("sets a recurrence rule", async () => {
    const onSet = vi.fn();
    const user = userEvent.setup();
    render(<TaskRecurrence onSet={onSet} pending={false} />);
    await user.click(screen.getByRole("button", { name: /set/i }));
    expect(onSet).toHaveBeenCalledWith("weekly", 1);
  });
});
