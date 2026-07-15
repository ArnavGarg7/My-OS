import type { DayPhase, EnergyLevel } from "../today";
import { timeToMinutes } from "../today";
import { generateRecommendation } from "./recommendations";
import type {
  BriefingContext,
  CalendarSection,
  ClosingSection,
  DayMode,
  EnergySection,
  FocusReason,
  FocusSection,
  GreetingSection,
  MissionSection,
  NextActionSection,
  NotificationsSection,
  RecommendationSection,
  RemainingDaySection,
  Salutation,
  SleepSection,
  WeatherSection,
  WorkoutSection,
  YesterdaySection,
} from "./types";

/**
 * Section builders (Sprint 2.2). Each briefing section is generated
 * independently + composably. Pure functions of the {@link BriefingContext}.
 */
const LOCALE = "en-US";

function salutationFor(phase: DayPhase): Salutation {
  if (phase === "morning") return "Good Morning";
  if (phase === "afternoon") return "Good Afternoon";
  return "Good Evening";
}

function modeFor(energy: EnergyLevel | null): DayMode {
  if (energy === "low") return "Recovery";
  if (energy === "medium") return "Steady";
  if (energy === "high") return "Deep Focus";
  return "Undefined";
}

export function buildGreeting(ctx: BriefingContext): GreetingSection {
  const dateLabel = new Intl.DateTimeFormat(LOCALE, {
    timeZone: ctx.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(ctx.now);
  const timeLabel = new Intl.DateTimeFormat(LOCALE, {
    timeZone: ctx.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(ctx.now);

  return {
    salutation: salutationFor(ctx.phase),
    name: ctx.name?.trim() || null,
    dateLabel,
    timeLabel,
    subtitle: "Here's today's operating briefing.",
  };
}

export function buildSleep(ctx: BriefingContext): SleepSection {
  const sleepTarget = ctx.state?.sleepTarget ?? null;
  const wakeTime = ctx.state?.wakeTime ?? null;
  let durationMinutes: number | null = null;
  if (sleepTarget && wakeTime) {
    const bed = timeToMinutes(sleepTarget);
    const wake = timeToMinutes(wakeTime);
    durationMinutes = (wake + 1440 - bed) % 1440;
  }
  return {
    hasData: Boolean(wakeTime),
    sleepTarget,
    wakeTime,
    durationMinutes,
    quality: null,
  };
}

export function buildEnergy(ctx: BriefingContext): EnergySection {
  return {
    current: ctx.state?.energyLevel ?? null,
    phase: ctx.phase,
    workingWindow: `${ctx.workingHours.start} – ${ctx.workingHours.end}`,
    mode: modeFor(ctx.state?.energyLevel ?? null),
  };
}

export function buildMission(ctx: BriefingContext): MissionSection {
  // Mission reason is optional and not stored yet — surfaced as null for now.
  return { mission: ctx.focus?.mission?.trim() || null, reason: null };
}

export function buildNextAction(ctx: BriefingContext): NextActionSection {
  const priority = ctx.focus?.priority?.trim();
  const deepWork = ctx.focus?.deepWork?.trim();
  const mission = ctx.focus?.mission?.trim();
  const action =
    priority || deepWork || (mission ? `Start: ${mission}` : "Set your mission for today.");
  return { action, hint: "Deterministic for now — this gets smarter later." };
}

export function buildFocus(ctx: BriefingContext): FocusSection {
  const score = ctx.state?.focusScore ?? null;
  const reasons: FocusReason[] = [];

  if (ctx.focus?.deepWork?.trim()) reasons.push({ positive: true, text: "Deep work scheduled" });
  if (ctx.focus?.mission?.trim()) reasons.push({ positive: true, text: "Mission defined" });
  else reasons.push({ positive: false, text: "No mission set" });
  if (!ctx.state?.wakeTime) reasons.push({ positive: false, text: "No wake time logged" });
  if ((ctx.metrics?.deepWorkMinutes ?? 0) >= 60)
    reasons.push({ positive: true, text: "Solid deep-work time" });
  if ((ctx.metrics?.interruptions ?? 0) > 5)
    reasons.push({ positive: false, text: "Interruptions logged" });

  if (score === null && reasons.length === 0) {
    reasons.push({ positive: false, text: "Not enough data yet" });
  }
  return { score, reasons: reasons.slice(0, 4) };
}

export function buildRemainingDay(ctx: BriefingContext): RemainingDaySection {
  return {
    remainingMinutes: ctx.snapshot.remainingDay.remainingMinutes,
    percentRemaining: ctx.snapshot.remainingDay.percentRemaining,
    phase: ctx.snapshot.phase,
    nextCheckpoint: ctx.snapshot.nextCheckpoint,
    productiveWindow: ctx.snapshot.productiveWindow,
  };
}

export function buildCalendar(_ctx: BriefingContext): CalendarSection {
  return { events: [], message: "No events scheduled." };
}

export function buildWorkout(_ctx: BriefingContext): WorkoutSection {
  return { planned: false, title: null, detail: null, time: null, message: "No workout planned." };
}

export function buildWeather(_ctx: BriefingContext): WeatherSection {
  return { message: "Weather integration arrives later." };
}

export function buildYesterday(ctx: BriefingContext): YesterdaySection {
  const y = ctx.yesterday ?? null;
  return {
    hasData: y !== null,
    completed: y?.completed ?? 0,
    incomplete: y?.incomplete ?? 0,
    carriedForward: y?.carriedForward ?? 0,
  };
}

export function buildNotifications(ctx: BriefingContext): NotificationsSection {
  return {
    unreadInbox: ctx.counts.unreadInbox,
    pendingDecisions: ctx.counts.pendingDecisions,
    pendingNotes: ctx.counts.pendingNotes,
  };
}

export function buildRecommendation(ctx: BriefingContext): RecommendationSection {
  return generateRecommendation(ctx);
}

export function buildClosing(ctx: BriefingContext): ClosingSection {
  const messages: Record<DayPhase, string> = {
    morning: "Have a productive day.",
    afternoon: "Make the rest of the day count.",
    evening: "Finish strong and wind down well.",
    night: "Rest well — tomorrow's briefing awaits.",
  };
  return { message: messages[ctx.phase] };
}
