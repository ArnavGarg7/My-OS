import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  computeMetrics,
  computeTimer,
  makeSession,
  completedSession,
  makeInterruptionFixture,
  makeBreakFixture,
  buildReadiness,
  type FocusRecommendation,
} from "@myos/core/focus";
import { SessionTimer } from "./SessionTimer";
import { ProgressRing } from "./ProgressRing";
import { ActiveTask } from "./ActiveTask";
import { SessionControls } from "./SessionControls";
import { InterruptionPanel } from "./InterruptionPanel";
import { BreakCard } from "./BreakCard";
import { ReadinessCard } from "./ReadinessCard";
import { Recommendations } from "./Recommendations";
import { SessionSummary } from "./SessionSummary";
import { FocusHistory } from "./FocusHistory";
import { StartPanel } from "./StartPanel";
import { formatClock, formatMinutes } from "./format";
import { SESSION_TYPE_LABEL, STATUS_LABEL, READINESS_LABEL } from "./focus-icons";

const NOW = new Date("2026-07-11T09:30:00Z");

describe("format helpers", () => {
  it("formats mm:ss", () => {
    expect(formatClock(90_000)).toBe("01:30");
    expect(formatClock(0)).toBe("00:00");
  });
  it("formats hours when over 60 min", () => {
    expect(formatClock(3_661_000)).toBe("1:01:01");
  });
  it("formats minute durations", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(120)).toBe("2h");
  });
});

describe("icon maps", () => {
  it("labels every session type", () => {
    expect(SESSION_TYPE_LABEL.deep_work).toBe("Deep Work");
    expect(STATUS_LABEL.running).toBe("Running");
    expect(READINESS_LABEL.ready).toBe("Ready");
  });
});

describe("ProgressRing", () => {
  it("renders children in the centre", () => {
    render(<ProgressRing value={50}>hi</ProgressRing>);
    expect(screen.getByText("hi")).toBeInTheDocument();
  });
  it("clamps out-of-range values without throwing", () => {
    expect(() => render(<ProgressRing value={150}>x</ProgressRing>)).not.toThrow();
  });
});

describe("SessionTimer", () => {
  it("shows remaining time and type", () => {
    const s = makeSession({ startedAt: "2026-07-11T09:00:00Z", plannedMinutes: 50 });
    render(<SessionTimer session={s} timer={computeTimer(s, NOW)} />);
    expect(screen.getByText("Deep Work")).toBeInTheDocument();
    expect(screen.getByText("20:00")).toBeInTheDocument();
  });
  it("shows over plan when overrunning", () => {
    const s = makeSession({ startedAt: "2026-07-11T08:00:00Z", plannedMinutes: 50 });
    render(<SessionTimer session={s} timer={computeTimer(s, NOW)} />);
    expect(screen.getByText("over plan")).toBeInTheDocument();
  });
});

describe("ActiveTask", () => {
  it("shows the task title and project badge", () => {
    render(<ActiveTask session={makeSession()} taskTitle="Ship v2" projectTitle="Apollo" />);
    expect(screen.getByText("Ship v2")).toBeInTheDocument();
    expect(screen.getByText("Apollo")).toBeInTheDocument();
  });
  it("falls back when no task title", () => {
    render(<ActiveTask session={makeSession({ plannerBlockId: null })} />);
    expect(screen.getByText("Untitled focus")).toBeInTheDocument();
  });
});

describe("SessionControls", () => {
  it("shows pause when running and fires callbacks", async () => {
    const onPause = vi.fn();
    const onComplete = vi.fn();
    render(
      <SessionControls
        session={makeSession({ status: "running" })}
        pending={false}
        onPause={onPause}
        onResume={vi.fn()}
        onBreak={vi.fn()}
        onComplete={onComplete}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Pause"));
    await userEvent.click(screen.getByText("Complete"));
    expect(onPause).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });
  it("shows resume when paused", () => {
    render(
      <SessionControls
        session={makeSession({ status: "paused" })}
        pending={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onBreak={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });
});

describe("InterruptionPanel", () => {
  it("renders the count and logs a type", async () => {
    const onLog = vi.fn();
    render(<InterruptionPanel count={3} onLog={onLog} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Phone"));
    expect(onLog).toHaveBeenCalledWith("phone");
  });
});

describe("BreakCard", () => {
  it("shows the active break and resumes", async () => {
    const onResume = vi.fn();
    const s = makeSession({
      status: "break",
      breaks: [makeBreakFixture({ endedAt: null, type: "recovery", plannedMinutes: 20 })],
    });
    render(<BreakCard session={s} onResume={onResume} pending={false} />);
    expect(screen.getByText("On a break")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Resume focus"));
    expect(onResume).toHaveBeenCalled();
  });
});

describe("ReadinessCard", () => {
  it("renders the readiness band + headline", () => {
    const r = buildReadiness({
      score: 88,
      hydrationPercent: 70,
      recovery: "high",
      sleepMinutes: 450,
    });
    render(<ReadinessCard readiness={r} />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText(/primed/)).toBeInTheDocument();
  });
});

describe("Recommendations", () => {
  const recs: FocusRecommendation[] = [
    { id: "break", title: "Take a break", detail: "50m in", action: "take_break", tone: "warning" },
  ];
  it("renders each recommendation", () => {
    render(<Recommendations items={recs} />);
    expect(screen.getByText("Take a break")).toBeInTheDocument();
  });
  it("renders nothing when empty", () => {
    const { container } = render(<Recommendations items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("SessionSummary", () => {
  it("shows derived metrics", () => {
    const metrics = computeMetrics(
      [completedSession("a", "deep_work", 50), completedSession("b", "shallow_work", 25)],
      NOW,
    );
    render(<SessionSummary metrics={metrics} />);
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.getAllByText("50m").length).toBeGreaterThan(0);
  });
});

describe("FocusHistory", () => {
  it("lists finished sessions", () => {
    render(
      <FocusHistory
        sessions={[
          completedSession("a", "deep_work", 50, { interruptions: [makeInterruptionFixture()] }),
        ]}
      />,
    );
    expect(screen.getByText("Deep Work")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
  it("shows an empty message when nothing finished", () => {
    render(<FocusHistory sessions={[makeSession({ status: "running", endedAt: null })]} />);
    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument();
  });
});

describe("StartPanel", () => {
  it("starts the selected type + duration", async () => {
    const onStart = vi.fn();
    render(<StartPanel onStart={onStart} pending={false} />);
    await userEvent.click(screen.getByText("25m"));
    await userEvent.click(screen.getByText("Start Deep Work"));
    expect(onStart).toHaveBeenCalledWith("deep_work", 25);
  });
  it("switches session type", async () => {
    const onStart = vi.fn();
    render(<StartPanel onStart={onStart} pending={false} />);
    await userEvent.click(screen.getByText("Review"));
    await userEvent.click(screen.getByText("Start Review"));
    expect(onStart).toHaveBeenCalledWith("review", 50);
  });
  it("defaults to deep work at 50m", async () => {
    const onStart = vi.fn();
    render(<StartPanel onStart={onStart} pending={false} />);
    await userEvent.click(screen.getByText("Start Deep Work"));
    expect(onStart).toHaveBeenCalledWith("deep_work", 50);
  });
  it("excludes meetings and breaks from startable types", () => {
    render(<StartPanel onStart={vi.fn()} pending={false} />);
    expect(screen.queryByText("Meeting")).not.toBeInTheDocument();
    expect(screen.queryByText("Recovery")).not.toBeInTheDocument();
  });
  it("disables start while pending", () => {
    render(<StartPanel onStart={vi.fn()} pending />);
    expect(screen.getByText("Start Deep Work").closest("button")).toBeDisabled();
  });
});

describe("SessionControls extra", () => {
  it("fires break and cancel", async () => {
    const onBreak = vi.fn();
    const onCancel = vi.fn();
    render(
      <SessionControls
        session={makeSession({ status: "running" })}
        pending={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onBreak={onBreak}
        onComplete={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByText("Break"));
    await userEvent.click(screen.getByText("Cancel"));
    expect(onBreak).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });
  it("disables actions while pending", () => {
    render(
      <SessionControls
        session={makeSession({ status: "running" })}
        pending
        onPause={vi.fn()}
        onResume={vi.fn()}
        onBreak={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Complete").closest("button")).toBeDisabled();
  });
});

describe("ReadinessCard low state", () => {
  it("renders recovery needed", () => {
    const r = buildReadiness({
      score: 20,
      hydrationPercent: 30,
      recovery: "low",
      sleepMinutes: 200,
    });
    render(<ReadinessCard readiness={r} />);
    expect(screen.getByText("Recovery Needed")).toBeInTheDocument();
  });
});

describe("InterruptionPanel all types", () => {
  it("renders every interruption button", () => {
    render(<InterruptionPanel count={0} onLog={vi.fn()} />);
    for (const label of ["Phone", "Meeting", "Message", "Distraction", "Other"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("FocusHistory abandoned", () => {
  it("marks an abandoned session", () => {
    render(
      <FocusHistory
        sessions={[
          completedSession("a", "deep_work", 40, {
            status: "abandoned",
            completed: false,
          }),
        ]}
      />,
    );
    expect(screen.getByText("Abandoned")).toBeInTheDocument();
  });
});
