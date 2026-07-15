import type { StudioStep, TomorrowStatus } from "./constants";
import { buildDayReview } from "./review";
import { collectCarryForward } from "./carryforward";
import { rankPriorities } from "./priorities";
import { mergeCalendar } from "./planner";
import { computeReadiness } from "./readiness";
import { checklistProgress, defaultChecklist } from "./checklist";
import { tomorrowSignals } from "./decisions";
import { buildRecommendations } from "./recommendations";
import { canFinalize, isReady, studioProgress } from "./preparation";
import type {
  CalendarMerge,
  CarryForwardList,
  ChecklistItem,
  ChecklistProgress,
  DayReview,
  PrioritySelection,
  TomorrowContext,
  TomorrowReadiness,
  TomorrowRecommendation,
  TomorrowSignals,
  TomorrowSummary,
} from "./types";

/**
 * TomorrowEngine (Sprint 3.1). Pure deterministic orchestration of the evening
 * workflow. Given a context assembled from the existing engines, it produces the
 * review, carry-forward list, ranked priorities, calendar merge, readiness,
 * checklist, decision signals and recommendations. It owns no data and never
 * mutates other engines. No AI.
 */
export interface TomorrowStudioState {
  planningDate: string;
  targetDate: string;
  review: DayReview;
  carryForward: CarryForwardList;
  priorities: PrioritySelection;
  calendar: CalendarMerge;
  readiness: TomorrowReadiness;
  checklist: ChecklistProgress;
  signals: TomorrowSignals;
  recommendations: TomorrowRecommendation[];
  progress: number;
  canFinalize: boolean;
  ready: boolean;
}

export class TomorrowEngine {
  run(ctx: TomorrowContext, step: StudioStep = "review"): TomorrowStudioState {
    const review = buildDayReview(ctx.review, ctx.planningDate);
    const carryForward = collectCarryForward(ctx.carryForwardCandidates);
    const priorities = rankPriorities(ctx.priorityCandidates);
    const calendar = mergeCalendar(ctx.calendar);
    const readiness = computeReadiness(ctx.readiness);
    const items: ChecklistItem[] = ctx.checklist ?? defaultChecklist();
    const checklist = checklistProgress(items);
    const signals = tomorrowSignals(carryForward, readiness, priorities.top.length);
    const recommendations = buildRecommendations(review, carryForward, readiness, signals);
    const finalizable = canFinalize(priorities, checklist);

    return {
      planningDate: ctx.planningDate,
      targetDate: ctx.targetDate,
      review,
      carryForward,
      priorities,
      calendar,
      readiness,
      checklist,
      signals,
      recommendations,
      progress: studioProgress(step),
      canFinalize: finalizable,
      ready: isReady(finalizable, readiness),
    };
  }

  signals(ctx: TomorrowContext): TomorrowSignals {
    const carryForward = collectCarryForward(ctx.carryForwardCandidates);
    const readiness = computeReadiness(ctx.readiness);
    const priorities = rankPriorities(ctx.priorityCandidates);
    return tomorrowSignals(carryForward, readiness, priorities.top.length);
  }

  summarize(
    state: TomorrowStudioState,
    status: TomorrowStatus,
    currentStep: StudioStep,
    plannerBlockCount: number,
  ): TomorrowSummary {
    return {
      targetDate: state.targetDate,
      status,
      priorityCount: state.priorities.top.length,
      carryForwardCount: state.carryForward.total,
      meetingMinutes: state.calendar.meetingMinutes,
      plannerBlockCount,
      readinessScore: state.readiness.score,
      checklistPercent: state.checklist.percent,
      currentStep,
      ready: state.ready,
    };
  }
}

export const tomorrowEngine = new TomorrowEngine();
