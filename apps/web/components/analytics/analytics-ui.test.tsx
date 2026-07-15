import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Review } from "@myos/core/analytics";
import { BarSeries, MetricBar, ScoreTile, TrendBadge } from "./AnalyticsCharts";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { ReviewView } from "./WeeklyReview";
import { directionTone, formatScore, formatSigned, scoreDot, scoreTone } from "./analytics-icons";

describe("analytics-icons", () => {
  it("tones scores by band", () => {
    expect(scoreTone(90)).toContain("success");
    expect(scoreTone(55)).toContain("warning");
    expect(scoreTone(20)).toContain("danger");
    expect(scoreDot(90)).toContain("bg-success");
  });
  it("formats scores + signed percentages", () => {
    expect(formatScore(82.6)).toBe("83");
    expect(formatSigned(6.25)).toBe("+6.3%");
    expect(formatSigned(-4)).toBe("-4%");
  });
  it("tones a trend direction (up = good by default)", () => {
    expect(directionTone("up")).toContain("success");
    expect(directionTone("down")).toContain("danger");
    expect(directionTone("up", false)).toContain("danger");
    expect(directionTone("flat")).toContain("subtle");
  });
});

describe("analytics-icons extra", () => {
  it("bands boundary scores", () => {
    expect(scoreTone(85)).toContain("success");
    expect(scoreTone(70)).toContain("success");
    expect(scoreTone(69)).toContain("warning");
    expect(scoreTone(50)).toContain("warning");
    expect(scoreTone(49)).toContain("danger");
  });
  it("rounds signed percentages to 1dp", () => {
    expect(formatSigned(0)).toBe("0%");
    expect(formatSigned(12.34)).toBe("+12.3%");
  });
  it("dots poor scores danger", () => {
    expect(scoreDot(10)).toContain("bg-danger");
  });
});

describe("ScoreTile", () => {
  it("renders the label + rounded score", () => {
    render(<ScoreTile label="Overall" score={82.4} />);
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });
  it("rounds .5 up", () => {
    render(<ScoreTile label="Focus" score={69.5} />);
    expect(screen.getByText("70")).toBeInTheDocument();
  });
  it("renders a zero score", () => {
    render(<ScoreTile label="Journal" score={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("MetricBar", () => {
  it("renders label, value + suffix", () => {
    render(<MetricBar label="Deep work" value={180} suffix="min" />);
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.getByText("180 min")).toBeInTheDocument();
  });
  it("renders a value with no suffix", () => {
    render(<MetricBar label="Tasks" value={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });
  it("renders a percent progress bar", () => {
    const { container } = render(<MetricBar label="Utilisation" value="80%" percent={80} />);
    expect(container.querySelector('[role="progressbar"], progress, div')).toBeTruthy();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });
  it("renders a string value", () => {
    render(<MetricBar label="Peak" value="2026-07-06" />);
    expect(screen.getByText("2026-07-06")).toBeInTheDocument();
  });
});

describe("TrendBadge", () => {
  it("shows a signed positive change", () => {
    render(<TrendBadge direction="up" changePercent={6} />);
    expect(screen.getByText("+6%")).toBeInTheDocument();
  });
  it("shows a negative change", () => {
    render(<TrendBadge direction="down" changePercent={-8} />);
    expect(screen.getByText("-8%")).toBeInTheDocument();
  });
  it("shows a flat change", () => {
    render(<TrendBadge direction="flat" changePercent={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});

describe("BarSeries", () => {
  it("renders one bar per datum", () => {
    const { container } = render(
      <BarSeries
        data={[
          { label: "goal", value: 3 },
          { label: "task", value: 5 },
        ]}
      />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });
  it("shows an empty state with no data", () => {
    render(<BarSeries data={[]} />);
    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });
  it("labels each bar with a title", () => {
    const { container } = render(<BarSeries data={[{ label: "goal", value: 3 }]} />);
    expect(container.querySelector("title")?.textContent).toBe("goal: 3");
  });
  it("exposes an accessible label", () => {
    render(<BarSeries data={[{ label: "a", value: 1 }]} ariaLabel="events by source" />);
    expect(screen.getByRole("img", { name: "events by source" })).toBeInTheDocument();
  });
});

describe("AnalyticsFilters", () => {
  it("renders all periods + highlights the active one", () => {
    render(<AnalyticsFilters period="weekly" onPeriod={vi.fn()} />);
    const week = screen.getByRole("button", { name: "Week" });
    expect(week).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "false");
  });
  it("switches period on click", async () => {
    const onPeriod = vi.fn();
    render(<AnalyticsFilters period="weekly" onPeriod={onPeriod} />);
    await userEvent.click(screen.getByRole("button", { name: "Quarter" }));
    expect(onPeriod).toHaveBeenCalledWith("quarterly");
  });
});

function review(over: Partial<Review> = {}): Review {
  return {
    reportType: "weekly",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-07",
    scores: {
      productivity: 80,
      focus: 70,
      planner: 75,
      health: 88,
      goals: 65,
      finance: 72,
      journal: 60,
      overall: 76,
    },
    productivity: {
      tasksCompleted: 12,
      tasksCreated: 4,
      plannerCompletion: 80,
      deepWorkMinutes: 300,
      contextSwitches: 3,
      focusBlocks: 4,
      decisionsCompleted: 2,
      avgExecutionMinutes: 25,
      score: 80,
    },
    focus: {
      deepWorkMinutes: 300,
      focusBlocks: 4,
      contextSwitches: 3,
      longestBlockMinutes: 120,
      score: 70,
    },
    timeline: {
      totalEvents: 40,
      dailyAverage: 6,
      bySource: {},
      peakDay: { date: "2026-07-06", count: 12 },
      activeDays: 6,
    },
    highlights: {
      mostProductiveDay: { date: "2026-07-06", count: 12 },
      longestFocusMinutes: 120,
      largestExpense: 15000,
      bestHabit: "Meditate",
      worstHabit: "Read",
      topDecision: "Ship it",
    },
    achievements: ["Completed 12 tasks"],
    bottlenecks: [],
    upcomingRisks: ["2 projects at risk"],
    ...over,
  };
}

describe("ReviewView", () => {
  it("renders the scoreboard + headline metrics", () => {
    render(<ReviewView review={review()} />);
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(screen.getByText("2026-07-01 → 2026-07-07")).toBeInTheDocument();
    expect(screen.getByText("Meditate")).toBeInTheDocument();
  });
  it("lists achievements + risks and shows a clean bottleneck state", () => {
    render(<ReviewView review={review()} />);
    expect(screen.getByText("Completed 12 tasks")).toBeInTheDocument();
    expect(screen.getByText("2 projects at risk")).toBeInTheDocument();
    expect(screen.getByText("No bottlenecks — clean run.")).toBeInTheDocument();
  });
  it("renders headline metrics", () => {
    render(<ReviewView review={review()} />);
    expect(screen.getByText("Tasks completed")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("₹15000")).toBeInTheDocument();
  });
  it("shows the largest expense + longest focus", () => {
    render(<ReviewView review={review()} />);
    expect(screen.getByText("300m")).toBeInTheDocument(); // deep work
    expect(screen.getByText("120m")).toBeInTheDocument(); // longest focus
  });
  it("renders bottlenecks when present", () => {
    render(<ReviewView review={review({ bottlenecks: ["High context switching"] })} />);
    expect(screen.getByText("High context switching")).toBeInTheDocument();
  });
  it("shows an empty achievements state", () => {
    render(<ReviewView review={review({ achievements: [] })} />);
    expect(screen.getByText("No achievements logged.")).toBeInTheDocument();
  });
  it("shows a no-risk state", () => {
    render(<ReviewView review={review({ upcomingRisks: [] })} />);
    expect(screen.getByText("No risks flagged.")).toBeInTheDocument();
  });
  it("renders a monthly review's period", () => {
    render(
      <ReviewView
        review={review({
          reportType: "monthly",
          periodStart: "2026-06-08",
          periodEnd: "2026-07-07",
        })}
      />,
    );
    expect(screen.getByText("2026-06-08 → 2026-07-07")).toBeInTheDocument();
  });
  it("shows the most productive day in highlights", () => {
    render(<ReviewView review={review()} />);
    expect(screen.getByText("Most productive")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07-06").length).toBeGreaterThan(0);
  });
});
