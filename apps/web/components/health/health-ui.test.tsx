import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  BodyMeasurement,
  HealthSummary,
  HydrationSummary,
  NutritionSummary,
  RecoveryResult,
  SleepAnalysis,
} from "@myos/core/health";
import { SleepCard } from "./SleepCard";
import { WaterCard } from "./WaterCard";
import { NutritionCard } from "./NutritionCard";
import { WorkoutCard } from "./WorkoutCard";
import { EnergyCard } from "./EnergyCard";
import { RecoveryCard } from "./RecoveryCard";
import { BodyMetricsCard } from "./BodyMetricsCard";
import { HealthGoals } from "./HealthGoals";
import { HealthInspector } from "./HealthInspector";
import { HealthTimeline } from "./HealthTimeline";
import { HealthQuickLog } from "./HealthQuickLog";
import { Sparkline } from "./HealthCharts";
import { formatMinutes, readinessTone } from "./health-icons";

const sleep: SleepAnalysis = {
  durationMinutes: 468,
  score: 88,
  debtMinutes: 0,
  rollingAverageMinutes: 460,
  bedtimeVarianceMinutes: 10,
  wakeVarianceMinutes: 8,
  consistency: 92,
};
const hydration: HydrationSummary = {
  totalMl: 1500,
  goalMl: 3000,
  remainingMl: 1500,
  completionPercent: 50,
  longestGapMinutes: 90,
};
const nutrition: NutritionSummary = {
  calories: 1200,
  protein: 80,
  carbs: 120,
  fat: 40,
  caloriesRemaining: 1000,
  proteinRemaining: 60,
  macroSplit: { protein: 30, carbs: 45, fat: 25 },
};
const recovery: RecoveryResult = { status: "recovered", score: 85, reasons: ["Well recovered"] };

const summary: HealthSummary = {
  date: "2026-07-07",
  sleep,
  recovery,
  readiness: {
    score: 84,
    band: "high",
    inputs: { sleep: 88, recovery: 85, hydration: 50, energy: 100 },
    recommendation: "Tackle your hardest work first.",
  },
  hydration,
  nutrition,
  workouts: { count: 1, totalMinutes: 45, totalVolume: 0, caloriesBurned: 320, averageRpe: 7 },
  energy: { level: "high", score: 100, source: "logged" },
  weight: 75,
};

describe("health-icons helpers", () => {
  it("formats minutes as h/m", () => {
    expect(formatMinutes(468)).toBe("7h 48m");
    expect(formatMinutes(45)).toBe("45m");
  });
  it("tones readiness by score", () => {
    expect(readinessTone(90)).toBe("success");
    expect(readinessTone(60)).toBe("warning");
    expect(readinessTone(30)).toBe("danger");
  });
});

describe("SleepCard", () => {
  it("renders duration + score", () => {
    render(<SleepCard sleep={sleep} />);
    expect(screen.getByText("7h 48m")).toBeInTheDocument();
    expect(screen.getByText(/Score 88/)).toBeInTheDocument();
  });
  it("shows an empty state without sleep", () => {
    render(<SleepCard sleep={null} />);
    expect(screen.getByText(/No sleep logged/)).toBeInTheDocument();
  });
});

describe("WaterCard", () => {
  it("renders intake and logs a glass", async () => {
    const onLog = vi.fn();
    const user = userEvent.setup();
    render(<WaterCard hydration={hydration} onLog={onLog} />);
    expect(screen.getByText(/1.5/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /500ml/ }));
    expect(onLog).toHaveBeenCalledWith(500);
  });
});

describe("NutritionCard", () => {
  it("shows calories + remaining", () => {
    render(<NutritionCard nutrition={nutrition} />);
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText(/1000 kcal · 60g protein left/)).toBeInTheDocument();
  });
});

describe("WorkoutCard", () => {
  it("summarizes today's sessions", () => {
    render(<WorkoutCard workouts={summary.workouts} />);
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText(/1 session/)).toBeInTheDocument();
  });
  it("shows empty state with no workouts", () => {
    render(
      <WorkoutCard
        workouts={{
          count: 0,
          totalMinutes: 0,
          totalVolume: 0,
          caloriesBurned: 0,
          averageRpe: null,
        }}
      />,
    );
    expect(screen.getByText(/No workouts logged/)).toBeInTheDocument();
  });
});

describe("EnergyCard", () => {
  it("renders level and sets energy", async () => {
    const onSet = vi.fn();
    const user = userEvent.setup();
    render(<EnergyCard energy={summary.energy} onSet={onSet} />);
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Low" }));
    expect(onSet).toHaveBeenCalledWith("low");
  });
});

describe("RecoveryCard", () => {
  it("renders status + reasons", () => {
    render(<RecoveryCard recovery={recovery} />);
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    expect(screen.getByText(/Well recovered/)).toBeInTheDocument();
  });
});

describe("BodyMetricsCard", () => {
  it("renders latest weight + trend", () => {
    const measurements: BodyMeasurement[] = [
      {
        id: "a",
        weight: 77,
        bodyFat: null,
        muscleMass: null,
        waist: null,
        recordedAt: "2026-07-05T07:00:00.000Z",
      },
      {
        id: "b",
        weight: 75,
        bodyFat: null,
        muscleMass: null,
        waist: null,
        recordedAt: "2026-07-07T07:00:00.000Z",
      },
    ];
    render(<BodyMetricsCard measurements={measurements} />);
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });
});

describe("HealthGoals", () => {
  it("renders goal rows", () => {
    render(<HealthGoals summary={summary} />);
    expect(screen.getByText("Today's Goals")).toBeInTheDocument();
    expect(screen.getByText("Water")).toBeInTheDocument();
    expect(screen.getByText("Protein")).toBeInTheDocument();
  });
});

describe("HealthInspector", () => {
  it("renders readiness + input breakdown", () => {
    render(<HealthInspector summary={summary} />);
    expect(screen.getByText("Readiness")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByText("Sleep")).toBeInTheDocument();
  });
});

describe("HealthTimeline", () => {
  it("orders today's logged events", () => {
    render(
      <HealthTimeline
        hydration={[{ id: "a", time: "2026-07-07T09:00:00.000Z", amountMl: 500, source: "water" }]}
        nutrition={[
          {
            id: "b",
            meal: "lunch",
            calories: 600,
            protein: 40,
            carbs: 60,
            fat: 20,
            loggedAt: "2026-07-07T13:00:00.000Z",
          },
        ]}
        workouts={[]}
      />,
    );
    expect(screen.getByText(/Water · 500ml/)).toBeInTheDocument();
    expect(screen.getByText(/lunch · 600 kcal/)).toBeInTheDocument();
  });
  it("shows empty state", () => {
    render(<HealthTimeline hydration={[]} nutrition={[]} workouts={[]} />);
    expect(screen.getByText(/Nothing logged/)).toBeInTheDocument();
  });
});

describe("HealthQuickLog", () => {
  it("submits parseable text and clears", async () => {
    const onLog = vi.fn().mockReturnValue(true);
    const user = userEvent.setup();
    render(<HealthQuickLog onLog={onLog} />);
    const input = screen.getByLabelText("Quick health log");
    await user.type(input, "drank 500ml");
    await user.click(screen.getByRole("button", { name: /log/i }));
    expect(onLog).toHaveBeenCalledWith("drank 500ml");
    expect((input as HTMLInputElement).value).toBe("");
  });
  it("shows an error for unparseable text", () => {
    const onLog = vi.fn().mockReturnValue(false);
    render(<HealthQuickLog onLog={onLog} />);
    const input = screen.getByLabelText("Quick health log");
    fireEvent.change(input, { target: { value: "xyz" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Couldn't understand/)).toBeInTheDocument();
  });
});

describe("Sparkline", () => {
  it("renders a chart with enough points", () => {
    render(<Sparkline values={[1, 2, 3]} label="Weight" unit="kg" />);
    expect(screen.getByRole("img", { name: /Weight trend/ })).toBeInTheDocument();
  });
  it("shows a fallback with too few points", () => {
    render(<Sparkline values={[1]} label="Weight" />);
    expect(screen.getByText(/not enough data/)).toBeInTheDocument();
  });
});
