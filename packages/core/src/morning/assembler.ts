import { planToday, todayInTimeZone } from "../today";
import {
  buildCalendar,
  buildClosing,
  buildEnergy,
  buildFocus,
  buildGreeting,
  buildMission,
  buildNextAction,
  buildNotifications,
  buildRecommendation,
  buildRemainingDay,
  buildSleep,
  buildWeather,
  buildWorkout,
  buildYesterday,
} from "./sections";
import type { AssemblerInput, BriefingContext, MorningBriefing } from "./types";

/**
 * Morning Briefing assembler (Sprint 2.2). Composes the section builders into a
 * complete briefing from Today state/metrics/focus + planner + preferences +
 * identity. Pure domain — nothing React, nothing async, no IO.
 */
export function assembleMorningBriefing(input: AssemblerInput): MorningBriefing {
  const date = input.state?.date ?? todayInTimeZone(input.timezone, input.now);
  const snapshot = planToday({ date, now: input.now, workingHours: input.workingHours });
  const ctx: BriefingContext = { ...input, snapshot, phase: snapshot.phase };

  return {
    greeting: buildGreeting(ctx),
    sleep: buildSleep(ctx),
    energy: buildEnergy(ctx),
    mission: buildMission(ctx),
    nextAction: buildNextAction(ctx),
    focus: buildFocus(ctx),
    remainingDay: buildRemainingDay(ctx),
    calendar: buildCalendar(ctx),
    workout: buildWorkout(ctx),
    weather: buildWeather(ctx),
    yesterday: buildYesterday(ctx),
    notifications: buildNotifications(ctx),
    recommendation: buildRecommendation(ctx),
    closing: buildClosing(ctx),
  };
}
