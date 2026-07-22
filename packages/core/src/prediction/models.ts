/**
 * Forecast Models (Sprint 6.2, spec §Forecast Models). Eight deterministic models — goal, deadline,
 * schedule, workload, study, project, health, habit — each turning already-derived historical inputs
 * into an immutable, explainable, confidence-scored Prediction. Pure; no AI, no randomness. Inputs
 * come from the SERVER (frozen module read models); the models never touch IO.
 */
import type { Prediction } from "./types";
import { computeConfidence } from "./confidence";
import { computeTrend, variability, velocity } from "./trend";
import { addDays, makePrediction, probability, type ForecastDeps } from "./forecast";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** ── Goal completion forecast ─────────────────────────────────────────── */
export interface GoalForecastInput {
  id: string;
  label: string;
  progress: number; // 0..100
  /** Recent per-day progress deltas (history). */
  progressHistory: number[];
  daysRemaining: number;
}
export function forecastGoal(g: GoalForecastInput, deps: ForecastDeps): Prediction {
  const currentPace = velocity(
    g.progressHistory.reduce((a, b) => a + b, 0),
    g.progressHistory.length || 1,
  );
  const remaining = Math.max(0, 100 - g.progress);
  const requiredPace = g.daysRemaining > 0 ? remaining / g.daysRemaining : remaining;
  const daysToFinish = currentPace > 0 ? Math.ceil(remaining / currentPace) : Infinity;
  const completionProb = probability(
    currentPace >= requiredPace ? 0.9 : requiredPace === 0 ? 1 : currentPace / requiredPace,
  );
  const onTrack = completionProb >= 0.6;
  const trend = computeTrend("goal progress/day", g.progressHistory);
  const confidence = computeConfidence({
    samples: g.progressHistory.length,
    variability: variability(g.progressHistory),
    missingFraction: 0,
    horizonDays: g.daysRemaining,
  });
  return makePrediction(deps, {
    kind: "goal",
    subject: g.id,
    outlook: onTrack ? "on_track" : "at_risk",
    metrics: {
      completionProbability: completionProb,
      currentPace,
      requiredPace,
      daysToFinish: Number.isFinite(daysToFinish) ? daysToFinish : 0,
    },
    horizonDays: g.daysRemaining,
    targetDate: Number.isFinite(daysToFinish) ? addDays(deps.now, daysToFinish) : null,
    confidence,
    trend,
    relatedObjects: [{ module: "goal", id: g.id, label: g.label }],
    explanation: {
      headline: onTrack ? `"${g.label}" on track` : `"${g.label}" at risk of missing its date`,
      calculations: [
        { label: "Current pace", value: `${currentPace}%/day` },
        { label: "Required pace", value: `${Math.round(requiredPace * 10) / 10}%/day` },
        { label: "Completion probability", value: pct(completionProb) },
      ],
      implication: onTrack
        ? "Maintain the current pace."
        : "Increase weekly effort or extend the timeline.",
    },
  });
}

/** ── Deadline forecast ────────────────────────────────────────────────── */
export interface DeadlineForecastInput {
  id: string;
  label: string;
  remainingTasks: number;
  completionVelocity: number; // tasks/day (historical)
  availableDays: number;
}
export function forecastDeadline(d: DeadlineForecastInput, deps: ForecastDeps): Prediction {
  const daysNeeded =
    d.completionVelocity > 0 ? Math.ceil(d.remainingTasks / d.completionVelocity) : Infinity;
  const buffer = Number.isFinite(daysNeeded) ? d.availableDays - daysNeeded : -d.remainingTasks;
  const delayProb = probability(
    buffer >= 0 ? 0.1 : Math.min(1, -buffer / Math.max(1, d.availableDays)),
  );
  const slipDays = Math.max(
    0,
    Number.isFinite(daysNeeded) ? daysNeeded - d.availableDays : d.remainingTasks,
  );
  const atRisk = buffer < 0;
  const confidence = computeConfidence({
    samples: Math.max(1, Math.round(d.completionVelocity * d.availableDays)),
    variability: 0.2,
    missingFraction: 0,
    horizonDays: d.availableDays,
  });
  return makePrediction(deps, {
    kind: "deadline",
    subject: d.id,
    outlook: atRisk ? "at_risk" : "on_track",
    metrics: {
      delayProbability: delayProb,
      slipDays,
      bufferDays: buffer,
      schedulePressure: probability(1 - buffer / Math.max(1, d.availableDays)),
    },
    horizonDays: d.availableDays,
    targetDate: addDays(deps.now, Number.isFinite(daysNeeded) ? daysNeeded : d.availableDays),
    confidence,
    relatedObjects: [{ module: "task", id: d.id, label: d.label }],
    explanation: {
      headline: atRisk
        ? `"${d.label}" likely to slip by ${slipDays} day${slipDays === 1 ? "" : "s"}`
        : `"${d.label}" on schedule`,
      calculations: [
        { label: "Average completion velocity", value: `${d.completionVelocity} tasks/day` },
        { label: "Remaining work", value: `${d.remainingTasks} tasks` },
        { label: "Available days", value: `${d.availableDays}` },
      ],
      implication: atRisk
        ? "Schedule dedicated blocks or reduce scope now."
        : "Current pace clears the deadline.",
    },
  });
}

/** ── Schedule forecast ────────────────────────────────────────────────── */
export interface ScheduleForecastInput {
  /** Per-day booked-minutes over the horizon. */
  bookedMinutesByDay: number[];
  dayCapacityMinutes: number;
}
export function forecastSchedule(s: ScheduleForecastInput, deps: ForecastDeps): Prediction {
  const overloaded = s.bookedMinutesByDay.filter((m) => m > s.dayCapacityMinutes).length;
  const freeWindows = s.bookedMinutesByDay.filter((m) => m < s.dayCapacityMinutes * 0.4).length;
  const density = s.bookedMinutesByDay.length
    ? probability(
        s.bookedMinutesByDay.reduce((a, b) => a + b, 0) /
          (s.bookedMinutesByDay.length * s.dayCapacityMinutes),
      )
    : 0;
  const atRisk = overloaded >= 2;
  const trend = computeTrend("daily booked minutes", s.bookedMinutesByDay);
  const confidence = computeConfidence({
    samples: s.bookedMinutesByDay.length,
    variability: variability(s.bookedMinutesByDay),
    missingFraction: 0,
    horizonDays: s.bookedMinutesByDay.length,
  });
  return makePrediction(deps, {
    kind: "schedule",
    subject: "week",
    outlook: atRisk ? "at_risk" : freeWindows >= 2 ? "opportunity" : "neutral",
    metrics: { overloadedDays: overloaded, freeWindows, meetingDensity: density },
    horizonDays: s.bookedMinutesByDay.length,
    confidence,
    trend,
    explanation: {
      headline: atRisk
        ? `${overloaded} overloaded days ahead`
        : freeWindows >= 2
          ? `${freeWindows} open days for deep work`
          : "Balanced schedule ahead",
      calculations: [
        { label: "Overloaded days", value: `${overloaded}` },
        { label: "Free windows", value: `${freeWindows}` },
        { label: "Meeting density", value: pct(density) },
      ],
      implication: atRisk
        ? "Rebalance now to protect focus time."
        : "Schedule has room for planned work.",
    },
  });
}

/** ── Workload / burnout forecast ─────────────────────────────────────── */
export interface WorkloadForecastInput {
  /** Recent daily workload scores (0..100). */
  workloadHistory: number[];
  /** Recent readiness scores (0..100). */
  readinessHistory: number[];
}
export function forecastWorkload(w: WorkloadForecastInput, deps: ForecastDeps): Prediction {
  const trend = computeTrend("daily workload", w.workloadHistory);
  const avgWorkload = w.workloadHistory.length
    ? w.workloadHistory.reduce((a, b) => a + b, 0) / w.workloadHistory.length
    : 0;
  const readinessTrend = computeTrend("readiness", w.readinessHistory);
  const burnoutProb = probability(
    (avgWorkload / 100) * 0.6 +
      (readinessTrend.direction === "falling" ? 0.3 : 0) +
      (trend.direction === "rising" ? 0.2 : 0),
  );
  const atRisk = burnoutProb >= 0.6;
  const confidence = computeConfidence({
    samples: w.workloadHistory.length,
    variability: variability(w.workloadHistory),
    missingFraction: 0,
    horizonDays: 7,
  });
  return makePrediction(deps, {
    kind: "workload",
    subject: "burnout",
    outlook: atRisk ? "at_risk" : "on_track",
    metrics: { burnoutProbability: burnoutProb, averageWorkload: Math.round(avgWorkload) },
    horizonDays: 7,
    confidence,
    trend,
    explanation: {
      headline: atRisk ? "Rising burnout risk this week" : "Workload is sustainable",
      calculations: [
        { label: "Average workload", value: `${Math.round(avgWorkload)}/100` },
        { label: "Workload trend", value: trend.direction },
        { label: "Readiness trend", value: readinessTrend.direction },
      ],
      implication: atRisk ? "Plan lighter days and protect recovery." : "Keep the current balance.",
    },
  });
}

/** ── Study / exam readiness forecast ─────────────────────────────────── */
export interface StudyForecastInput {
  id: string;
  label: string;
  syllabusPercent: number; // 0..100 covered
  studyHistory: number[]; // minutes/day
  daysToExam: number;
}
export function forecastStudy(s: StudyForecastInput, deps: ForecastDeps): Prediction {
  const remaining = Math.max(0, 100 - s.syllabusPercent);
  const avgMinutes = s.studyHistory.length
    ? s.studyHistory.reduce((a, b) => a + b, 0) / s.studyHistory.length
    : 0;
  // Assume ~2% syllabus per focused hour.
  const projectedCoverage = probability(
    (s.syllabusPercent + (avgMinutes / 60) * 2 * s.daysToExam) / 100,
  );
  const ready = projectedCoverage >= 0.9;
  const trend = computeTrend("study minutes/day", s.studyHistory);
  const confidence = computeConfidence({
    samples: s.studyHistory.length,
    variability: variability(s.studyHistory),
    missingFraction: 0,
    horizonDays: s.daysToExam,
  });
  return makePrediction(deps, {
    kind: "study",
    subject: s.id,
    outlook: ready ? "on_track" : "at_risk",
    metrics: {
      projectedCoverage,
      remainingPercent: remaining,
      avgMinutesPerDay: Math.round(avgMinutes),
    },
    horizonDays: s.daysToExam,
    targetDate: addDays(deps.now, s.daysToExam),
    confidence,
    trend,
    relatedObjects: [{ module: "knowledge", id: s.id, label: s.label }],
    explanation: {
      headline: ready ? `On pace to finish "${s.label}"` : `"${s.label}" prep behind schedule`,
      calculations: [
        { label: "Syllabus covered", value: `${s.syllabusPercent}%` },
        { label: "Avg study", value: `${Math.round(avgMinutes)} min/day` },
        { label: "Projected coverage", value: pct(projectedCoverage) },
      ],
      implication: ready ? "Add spaced revision windows." : "Increase daily study or narrow scope.",
    },
  });
}

/** ── Project milestone forecast ──────────────────────────────────────── */
export interface ProjectForecastInput {
  id: string;
  label: string;
  progress: number; // 0..100
  velocityHistory: number[]; // progress/day
  blockedTasks: number;
  targetDays: number;
}
export function forecastProject(p: ProjectForecastInput, deps: ForecastDeps): Prediction {
  const pace = velocity(
    p.velocityHistory.reduce((a, b) => a + b, 0),
    p.velocityHistory.length || 1,
  );
  const remaining = Math.max(0, 100 - p.progress);
  const daysNeeded = pace > 0 ? Math.ceil(remaining / pace) : Infinity;
  const delayProb = probability(
    Number.isFinite(daysNeeded)
      ? Math.max(0, (daysNeeded - p.targetDays) / Math.max(1, p.targetDays))
      : 1,
  );
  const blockedPenalty = p.blockedTasks > 0 ? 0.15 * Math.min(3, p.blockedTasks) : 0;
  const atRisk = delayProb + blockedPenalty >= 0.5;
  const trend = computeTrend("project progress/day", p.velocityHistory);
  const confidence = computeConfidence({
    samples: p.velocityHistory.length,
    variability: variability(p.velocityHistory),
    missingFraction: 0,
    horizonDays: p.targetDays,
    conflicting: p.blockedTasks > 0,
  });
  return makePrediction(deps, {
    kind: "project",
    subject: p.id,
    outlook: atRisk ? "at_risk" : "on_track",
    metrics: {
      delayProbability: probability(delayProb + blockedPenalty),
      estimatedDays: Number.isFinite(daysNeeded) ? daysNeeded : 0,
      blockedTasks: p.blockedTasks,
    },
    horizonDays: p.targetDays,
    targetDate: Number.isFinite(daysNeeded) ? addDays(deps.now, daysNeeded) : null,
    confidence,
    trend,
    relatedObjects: [{ module: "project", id: p.id, label: p.label }],
    explanation: {
      headline: atRisk ? `"${p.label}" milestone likely to slip` : `"${p.label}" on track`,
      calculations: [
        { label: "Progress pace", value: `${pace}%/day` },
        { label: "Estimated days", value: Number.isFinite(daysNeeded) ? `${daysNeeded}` : "—" },
        { label: "Blocked tasks", value: `${p.blockedTasks}` },
      ],
      implication: atRisk ? "Unblock work and re-scope the milestone." : "Momentum is sufficient.",
    },
  });
}

/** ── Health / recovery forecast ──────────────────────────────────────── */
export interface HealthForecastInput {
  readinessHistory: number[];
  sleepHistory: number[]; // hours/night
  workoutDays: number[]; // 1=workout, 0=rest over recent window
}
export function forecastHealth(h: HealthForecastInput, deps: ForecastDeps): Prediction {
  const recoveryTrend = computeTrend("readiness", h.readinessHistory);
  const sleepTrend = computeTrend("sleep hours", h.sleepHistory);
  const consistency = h.workoutDays.length
    ? h.workoutDays.reduce((a, b) => a + b, 0) / h.workoutDays.length
    : 0;
  const declining = recoveryTrend.direction === "falling" || sleepTrend.direction === "falling";
  const confidence = computeConfidence({
    samples: h.readinessHistory.length,
    variability: variability(h.readinessHistory),
    missingFraction: 0,
    horizonDays: 7,
  });
  return makePrediction(deps, {
    kind: "health",
    subject: "recovery",
    outlook: declining ? "at_risk" : consistency >= 0.5 ? "on_track" : "neutral",
    metrics: {
      workoutConsistency: probability(consistency),
      avgReadiness: Math.round(recoveryTrend.movingAverage),
    },
    horizonDays: 7,
    confidence,
    trend: recoveryTrend,
    explanation: {
      headline: declining ? "Recovery trending down" : "Recovery is stable",
      calculations: [
        { label: "Readiness trend", value: recoveryTrend.direction },
        { label: "Sleep trend", value: sleepTrend.direction },
        { label: "Workout consistency", value: pct(consistency) },
      ],
      implication: declining
        ? "Prioritise sleep and lighter training this week."
        : "Energy should stay available.",
    },
  });
}

/** ── Habit streak forecast ───────────────────────────────────────────── */
export interface HabitForecastInput {
  id: string;
  label: string;
  currentStreak: number;
  /** Recent adherence (1=done, 0=missed). */
  adherenceHistory: number[];
}
export function forecastHabit(h: HabitForecastInput, deps: ForecastDeps): Prediction {
  const consistency = h.adherenceHistory.length
    ? h.adherenceHistory.reduce((a, b) => a + b, 0) / h.adherenceHistory.length
    : 0;
  const recent = h.adherenceHistory.slice(-3);
  const recentMisses = recent.filter((x) => x === 0).length;
  const breakProb = probability((1 - consistency) * 0.6 + recentMisses * 0.2);
  const atRisk = breakProb >= 0.5;
  const trend = computeTrend("habit adherence", h.adherenceHistory);
  const confidence = computeConfidence({
    samples: h.adherenceHistory.length,
    variability: variability(h.adherenceHistory),
    missingFraction: 0,
    horizonDays: 7,
  });
  return makePrediction(deps, {
    kind: "habit",
    subject: h.id,
    outlook: atRisk ? "at_risk" : "on_track",
    metrics: {
      streakBreakProbability: breakProb,
      consistency: probability(consistency),
      currentStreak: h.currentStreak,
    },
    horizonDays: 7,
    confidence,
    trend,
    relatedObjects: [{ module: "life", id: h.id, label: h.label }],
    explanation: {
      headline: atRisk ? `"${h.label}" streak at risk` : `"${h.label}" streak likely to continue`,
      calculations: [
        { label: "Current streak", value: `${h.currentStreak} days` },
        { label: "Consistency", value: pct(consistency) },
        { label: "Recent misses", value: `${recentMisses}` },
      ],
      implication: atRisk
        ? "Anchor it to an existing routine to protect the streak."
        : "Keep the routine steady.",
    },
  });
}
