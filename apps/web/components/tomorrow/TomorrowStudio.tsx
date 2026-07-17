"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@myos/ui";
import { nextStep, previousStep, type StudioStep } from "@myos/core/tomorrow";
import { PageLoading } from "@/components/framework";
import { useTomorrow } from "./use-tomorrow";
import { StudioHeader } from "./StudioHeader";
import { StudioSidebar } from "./StudioSidebar";
import { DayReview } from "./DayReview";
import { CarryForward } from "./CarryForward";
import { PrioritySelection } from "./PrioritySelection";
import { TomorrowCalendar } from "./TomorrowCalendar";
import { PlannerPreview } from "./PlannerPreview";
import { TomorrowReadiness } from "./TomorrowReadiness";
import { TomorrowChecklist } from "./TomorrowChecklist";
import { TomorrowSummary } from "./TomorrowSummary";
import { FocusReviewStats } from "@/components/focus/FocusReviewStats";
import { AutomationSuggestions } from "@/components/automation/AutomationSuggestions";
import { TomorrowOrchestration } from "./TomorrowOrchestration";
import { TomorrowKnowledge } from "./TomorrowKnowledge";
import { TomorrowLife } from "./TomorrowLife";
import { TomorrowResource } from "./TomorrowResource";
import { TomorrowPriorities } from "./TomorrowPriorities";

/**
 * Tomorrow Studio (Sprint 3.1). The full-screen, guided evening workflow — the
 * deterministic counterpart to Morning Briefing. One flow, eight steps: review →
 * carry forward → priorities → calendar → planner preview → readiness → checklist
 * → finalize. It orchestrates the existing engines and owns nothing.
 */
export function TomorrowStudio() {
  const t = useTomorrow();

  if (t.isLoading || !t.state) return <PageLoading label="Closing out today…" />;

  const state = t.state;
  const locked = t.plan?.status === "locked" || t.plan?.status === "completed";

  const body = (step: StudioStep) => {
    switch (step) {
      case "review":
        return (
          <div className="flex flex-col gap-4">
            <DayReview review={state.review} />
            <FocusReviewStats />
            <AutomationSuggestions />
          </div>
        );
      case "carry_forward":
        return (
          <CarryForward
            list={state.carryForward}
            accepted={t.acceptedCarry}
            onToggle={t.toggleCarry}
          />
        );
      case "priorities":
        return (
          <div className="flex flex-col gap-3">
            <PrioritySelection
              ranked={t.priorityView}
              chosen={t.chosenPriorities}
              onToggle={t.togglePriority}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={t.savePriorities}
              disabled={t.chosenPriorities.size === 0}
            >
              Save priorities
            </Button>
          </div>
        );
      case "calendar":
        return <TomorrowCalendar merge={state.calendar} />;
      case "planner":
        return (
          <PlannerPreview
            preview={t.previewData}
            onGenerate={() => t.preview("regenerate")}
            onDiscard={() => t.preview("discard")}
            pending={t.previewing}
          />
        );
      case "readiness":
        return (
          <div className="flex flex-col gap-3">
            <TomorrowReadiness readiness={state.readiness} />
            <TomorrowLife />
            <TomorrowResource />
            <TomorrowPriorities />
            <TomorrowKnowledge />
            <TomorrowOrchestration />
          </div>
        );
      case "checklist":
        return <TomorrowChecklist checklist={state.checklist} onToggle={t.toggleChecklist} />;
      case "finalize":
        return (
          <TomorrowSummary
            state={state}
            canFinalize={state.canFinalize}
            onFinalize={t.finalize}
            onLock={t.lock}
            pending={t.pending}
            locked={locked}
          />
        );
    }
  };

  const canPrev = previousStep(t.step) !== null;
  const canNext = nextStep(t.step) !== null;

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <StudioHeader
        step={t.step}
        status={t.plan?.status ?? "draft"}
        targetDate={t.plan?.targetDate ?? null}
      />
      <div className="flex min-h-0 flex-1 gap-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <StudioSidebar step={t.step} onStep={t.goToStep} state={state} />
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto">{body(t.step)}</div>
      </div>
      <div className="border-border flex items-center justify-between border-t pt-3">
        <Button variant="ghost" onClick={t.prev} disabled={!canPrev}>
          <ArrowLeft size={14} aria-hidden />
          Back
        </Button>
        <Button onClick={t.next} disabled={!canNext}>
          Next
          <ArrowRight size={14} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
