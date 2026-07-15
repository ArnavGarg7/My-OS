import type {
  Checkpoint,
  DailyFocus,
  DailyMetrics,
  DailyState,
  DayPhase,
  EnergyLevel,
  ProductiveWindow,
  TodaySnapshot,
  WorkingHours,
} from "../today";

/**
 * Morning Briefing types (Sprint 2.2). A briefing is a read-top-to-bottom
 * report assembled deterministically from the Today engine — no AI, no React.
 */

export type Salutation = "Good Morning" | "Good Afternoon" | "Good Evening";
export type DayMode = "Recovery" | "Steady" | "Deep Focus" | "Undefined";

export interface GreetingSection {
  salutation: Salutation;
  name: string | null;
  dateLabel: string; // e.g. "Tuesday, July 7"
  timeLabel: string; // e.g. "07:18 AM"
  subtitle: string;
}

export interface SleepSection {
  hasData: boolean;
  sleepTarget: string | null; // HH:mm
  wakeTime: string | null; // HH:mm
  durationMinutes: number | null;
  quality: string | null;
}

export interface EnergySection {
  current: EnergyLevel | null;
  phase: DayPhase;
  workingWindow: string; // "09:00 – 18:00"
  mode: DayMode;
}

export interface MissionSection {
  mission: string | null;
  reason: string | null;
}

export interface NextActionSection {
  action: string;
  hint: string;
}

export interface FocusReason {
  positive: boolean;
  text: string;
}

export interface FocusSection {
  score: number | null;
  reasons: FocusReason[];
}

export interface RemainingDaySection {
  remainingMinutes: number;
  percentRemaining: number;
  phase: DayPhase;
  nextCheckpoint: Checkpoint | null;
  productiveWindow: ProductiveWindow;
}

export interface CalendarEvent {
  title: string;
  at: string;
}

export interface CalendarSection {
  events: CalendarEvent[];
  message: string | null;
}

export interface WorkoutSection {
  planned: boolean;
  title: string | null;
  detail: string | null;
  time: string | null;
  message: string | null;
}

export interface WeatherSection {
  message: string;
}

export interface YesterdaySection {
  hasData: boolean;
  completed: number;
  incomplete: number;
  carriedForward: number;
}

export interface NotificationsSection {
  unreadInbox: number;
  pendingDecisions: number;
  pendingNotes: number;
}

export interface Recommendation {
  id: string;
  decision: string;
  reason: string;
  confidence: number; // 0–100
}

export type RecommendationSection = Recommendation;

export interface ClosingSection {
  message: string;
}

export interface MorningBriefing {
  greeting: GreetingSection;
  sleep: SleepSection;
  energy: EnergySection;
  mission: MissionSection;
  nextAction: NextActionSection;
  focus: FocusSection;
  remainingDay: RemainingDaySection;
  calendar: CalendarSection;
  workout: WorkoutSection;
  weather: WeatherSection;
  yesterday: YesterdaySection;
  notifications: NotificationsSection;
  recommendation: RecommendationSection;
  closing: ClosingSection;
}

export interface BriefingCounts {
  unreadInbox: number;
  pendingDecisions: number;
  pendingNotes: number;
}

export interface YesterdayData {
  completed: number;
  incomplete: number;
  carriedForward: number;
}

/** Everything the assembler needs. Pure data — the caller loads it. */
export interface AssemblerInput {
  now: Date;
  timezone: string;
  name: string | null;
  state: DailyState | null;
  focus: DailyFocus | null;
  metrics: DailyMetrics | null;
  workingHours: WorkingHours;
  counts: BriefingCounts;
  yesterday?: YesterdayData | null;
}

/** Assembler input enriched with the deterministic day snapshot. */
export interface BriefingContext extends AssemblerInput {
  snapshot: TodaySnapshot;
  phase: DayPhase;
}
