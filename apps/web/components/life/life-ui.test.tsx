import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  computeReadiness,
  defaultInputs,
  makeAppointment,
  makeHabit,
  makeInjury,
  makeMedication,
  makeRoutine,
  makeSupplement,
  makeVision,
  makeWorkout,
  type StreakInfo,
} from "@myos/core/life";
import { HabitEditor } from "./HabitEditor";
import { HabitTracker } from "./HabitTracker";
import { HabitCalendar } from "./HabitCalendar";
import { StreakInspector } from "./StreakInspector";
import { RoutineBuilder } from "./RoutineBuilder";
import { RoutineTimeline } from "./RoutineTimeline";
import { MedicationTracker } from "./MedicationTracker";
import { SupplementTracker } from "./SupplementTracker";
import { WorkoutPrograms } from "./WorkoutPrograms";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { BodyComposition } from "./BodyComposition";
import { InjuryLog } from "./InjuryLog";
import { DoctorAppointments } from "./DoctorAppointments";
import { PersonalGrowth } from "./PersonalGrowth";
import {
  INJURY_STATUS_LABEL,
  RECOMMENDATION_LABEL,
  ROUTINE_TYPE_LABEL,
  MEDICATION_FREQUENCY_LABEL,
} from "./life-icons";

const streak = (over: Partial<StreakInfo> = {}): StreakInfo & { habitId: string } => ({
  habitId: "habit-1",
  current: 5,
  longest: 12,
  consistency: 80,
  completionRate: 80,
  missedDays: 6,
  recoveryScore: 70,
  atRisk: false,
  ...over,
});

describe("life-icons", () => {
  it("labels routines, injuries, recommendations + frequencies", () => {
    expect(ROUTINE_TYPE_LABEL.morning).toBe("Morning");
    expect(INJURY_STATUS_LABEL.recovering).toBe("Recovering");
    expect(RECOMMENDATION_LABEL.rest).toBe("Rest");
    expect(MEDICATION_FREQUENCY_LABEL.twice_daily).toBe("Twice daily");
  });
});

describe("HabitEditor", () => {
  it("creates a habit with the chosen frequency", async () => {
    const onCreate = vi.fn();
    render(<HabitEditor onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Habit name"), "Meditate");
    await userEvent.selectOptions(screen.getByLabelText("Habit frequency"), "weekly");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledWith({ name: "Meditate", frequency: "weekly" });
  });

  it("ignores an empty name", async () => {
    const onCreate = vi.fn();
    render(<HabitEditor onCreate={onCreate} />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe("HabitTracker", () => {
  it("shows a habit with its streak + consistency", () => {
    render(
      <HabitTracker
        habits={[makeHabit()]}
        streaks={[streak()]}
        selectedId={null}
        onSelect={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByText("Meditate")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/80% consistent/)).toBeInTheDocument();
  });

  it("flags an at-risk habit", () => {
    render(
      <HabitTracker
        habits={[makeHabit()]}
        streaks={[streak({ atRisk: true })]}
        selectedId={null}
        onSelect={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByText("At risk")).toBeInTheDocument();
  });

  it("fires complete + select", async () => {
    const onComplete = vi.fn();
    const onSelect = vi.fn();
    render(
      <HabitTracker
        habits={[makeHabit()]}
        streaks={[streak()]}
        selectedId={null}
        onSelect={onSelect}
        onComplete={onComplete}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Done/ }));
    expect(onComplete).toHaveBeenCalledWith("habit-1");
    await userEvent.click(screen.getByText("Meditate"));
    expect(onSelect).toHaveBeenCalledWith("habit-1");
  });

  it("shows an empty state", () => {
    render(
      <HabitTracker
        habits={[]}
        streaks={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByText("No habits yet")).toBeInTheDocument();
  });
});

describe("StreakInspector + HabitCalendar", () => {
  it("shows every derived streak metric", () => {
    render(<StreakInspector habit={makeHabit()} streak={streak()} />);
    expect(screen.getByText("12")).toBeInTheDocument(); // longest
    expect(screen.getByText("70%")).toBeInTheDocument(); // recovery
  });

  it("prompts when nothing is selected", () => {
    render(<StreakInspector habit={null} streak={null} />);
    expect(screen.getByText(/Select a habit/)).toBeInTheDocument();
  });

  it("renders a consistency bar per habit", () => {
    render(<HabitCalendar habits={[{ id: "habit-1", name: "Meditate" }]} streaks={[streak()]} />);
    expect(screen.getByLabelText("80% consistent")).toBeInTheDocument();
  });
});

describe("RoutineBuilder + RoutineTimeline", () => {
  it("builds a routine with steps", async () => {
    const onCreate = vi.fn();
    render(<RoutineBuilder onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Routine name"), "Evening");
    await userEvent.type(screen.getByLabelText("Step title"), "Read");
    await userEvent.click(screen.getByRole("button", { name: /Step/ }));
    await userEvent.click(screen.getByRole("button", { name: /Create routine/ }));
    expect(onCreate).toHaveBeenCalledWith({
      name: "Evening",
      steps: [{ title: "Read", durationMinutes: 10 }],
    });
  });

  it("lists routines with steps + total duration", () => {
    render(<RoutineTimeline routines={[makeRoutine()]} onComplete={vi.fn()} />);
    expect(screen.getByText("Morning Routine")).toBeInTheDocument();
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText(/25 min total/)).toBeInTheDocument();
  });

  it("fires complete", async () => {
    const onComplete = vi.fn();
    render(<RoutineTimeline routines={[makeRoutine()]} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole("button", { name: /Complete/ }));
    expect(onComplete).toHaveBeenCalledWith("routine-1");
  });

  it("shows an empty state", () => {
    render(<RoutineTimeline routines={[]} onComplete={vi.fn()} />);
    expect(screen.getByText("No routines yet")).toBeInTheDocument();
  });
});

describe("MedicationTracker + SupplementTracker", () => {
  it("adds + logs a medication", async () => {
    const onAdd = vi.fn();
    const onLog = vi.fn();
    render(<MedicationTracker medications={[makeMedication()]} onAdd={onAdd} onLog={onLog} />);
    expect(screen.getByText("Vitamin D")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Log dose/ }));
    expect(onLog).toHaveBeenCalledWith("med-1");
    await userEvent.type(screen.getByLabelText("Medication name"), "Omega 3");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith({ name: "Omega 3" });
  });

  it("lists supplements", () => {
    render(<SupplementTracker supplements={[makeSupplement()]} onAdd={vi.fn()} />);
    expect(screen.getByText("Creatine")).toBeInTheDocument();
  });
});

describe("WorkoutPrograms + ExerciseLibrary", () => {
  it("shows weekly load + logs a workout", async () => {
    const onLog = vi.fn();
    render(<WorkoutPrograms workouts={[makeWorkout()]} onLog={onLog} />);
    expect(screen.getByText(/Weekly load/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Log workout/ }));
    expect(onLog).toHaveBeenCalled();
  });

  it("derives PRs from sessions", () => {
    render(<ExerciseLibrary workouts={[makeWorkout()]} />);
    expect(screen.getByText("100 kg")).toBeInTheDocument();
  });

  it("shows an empty PR library", () => {
    render(<ExerciseLibrary workouts={[]} />);
    expect(screen.getByText("No exercises yet")).toBeInTheDocument();
  });
});

describe("BodyComposition + InjuryLog + DoctorAppointments", () => {
  it("logs a body measurement", async () => {
    const onLog = vi.fn();
    render(<BodyComposition body={[]} onLog={onLog} />);
    await userEvent.type(screen.getByLabelText("Weight"), "75");
    await userEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(onLog).toHaveBeenCalledWith({ weightKg: 75 });
  });

  it("lists injuries with status", () => {
    render(<InjuryLog injuries={[makeInjury()]} onAdd={vi.fn()} />);
    expect(screen.getByText("Sprained ankle")).toBeInTheDocument();
    expect(screen.getByText("Recovering")).toBeInTheDocument();
  });

  it("lists + completes appointments", async () => {
    const onComplete = vi.fn();
    render(
      <DoctorAppointments
        appointments={[makeAppointment()]}
        onAdd={vi.fn()}
        onComplete={onComplete}
      />,
    );
    expect(screen.getByText("Annual physical")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Done/ }));
    expect(onComplete).toHaveBeenCalledWith("appt-1");
  });
});

describe("PersonalGrowth", () => {
  it("adds a vision statement with a life area", async () => {
    const onAddVision = vi.fn();
    render(
      <PersonalGrowth vision={[]} reviews={[]} onAddVision={onAddVision} onStartReview={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText("Vision statement"), "I train daily.");
    await userEvent.selectOptions(screen.getByLabelText("Life area"), "career");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAddVision).toHaveBeenCalledWith({
      category: "career",
      statement: "I train daily.",
      isIdentity: true,
    });
  });

  it("lists vision items + identity badge", () => {
    render(
      <PersonalGrowth
        vision={[makeVision()]}
        reviews={[]}
        onAddVision={vi.fn()}
        onStartReview={vi.fn()}
      />,
    );
    expect(screen.getByText("Identity")).toBeInTheDocument();
  });

  it("starts a period review", async () => {
    const onStartReview = vi.fn();
    render(
      <PersonalGrowth
        vision={[]}
        reviews={[]}
        onAddVision={vi.fn()}
        onStartReview={onStartReview}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "weekly" }));
    expect(onStartReview).toHaveBeenCalledWith({ frequency: "weekly" });
  });
});

describe("readiness rendering contract", () => {
  it("produces recommendation labels the dashboard can render", () => {
    const r = computeReadiness(defaultInputs());
    expect(RECOMMENDATION_LABEL[r.trainingRecommendation]).toBeTruthy();
    expect(RECOMMENDATION_LABEL[r.workRecommendation]).toBeTruthy();
    expect(RECOMMENDATION_LABEL[r.studyRecommendation]).toBeTruthy();
  });
});
