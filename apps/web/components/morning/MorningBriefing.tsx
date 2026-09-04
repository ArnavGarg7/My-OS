"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@myos/ui";
import { assembleMorningBriefing, type MorningBriefing as Briefing } from "@myos/core/morning";
import { selectWorkingHours, type EnergyLevel } from "@myos/core/today";
import { PRIORITY_WEIGHT, selectOpen } from "@myos/core/task";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useToaster } from "@/lib/framework";
import { useFocusLauncher } from "@/lib/focus/use-focus-launcher";
import { useIdentity } from "@/lib/identity";
import { useMorningFlash } from "@/lib/today/morning-flash";
import { trpc } from "@/lib/trpc/client";
import { DecisionCard } from "@/components/decision/DecisionCard";
import { DecisionExplanationDialog } from "@/components/decision/DecisionExplanationDialog";
import { useDecisions } from "@/components/decision/use-decisions";
import { MorningSection } from "./MorningSection";
import { GreetingSection } from "./GreetingSection";
import { SleepSection } from "./SleepSection";
import { EnergySection } from "./EnergySection";
import { MissionSection } from "./MissionSection";
import { NextActionSection } from "./NextActionSection";
import { FocusSection } from "./FocusSection";
import { RemainingDaySection } from "./RemainingDaySection";
import { CalendarSection } from "./CalendarSection";
import { WorkoutSection } from "./WorkoutSection";
import { WeatherSection } from "./WeatherSection";
import { YesterdaySection } from "./YesterdaySection";
import { NotificationsSection } from "./NotificationsSection";
import { ClosingSection } from "./ClosingSection";
import { MorningPlanSection } from "./MorningPlanSection";
import { MorningCalendarSection } from "./MorningCalendarSection";
import { MorningProjectSection } from "./MorningProjectSection";
import { MorningJournalSection } from "./MorningJournalSection";
import { MorningFinanceSection } from "./MorningFinanceSection";
import { MorningGoalSection } from "./MorningGoalSection";
import { MorningTimelineSection } from "./MorningTimelineSection";
import { MorningAnalyticsSection } from "./MorningAnalyticsSection";
import { MorningTomorrowSection } from "./MorningTomorrowSection";
import { MorningFocusSection } from "./MorningFocusSection";
import { MorningNotificationSection } from "./MorningNotificationSection";
import { MorningAutomationSection } from "./MorningAutomationSection";
import { MorningOrchestrationSection } from "./MorningOrchestrationSection";
import { MorningKnowledgeSection } from "./MorningKnowledgeSection";
import { MorningLifeSection } from "./MorningLifeSection";
import { MorningResourceSection } from "./MorningResourceSection";
import { MorningExecutiveSection } from "./MorningExecutiveSection";
import { HealthMorningSlot } from "@/components/health/HealthMorningSlot";
import { GetStartedCard } from "@/components/onboarding/GetStartedCard";

/**
 * Morning Briefing (Sprint 2.2). A single scrollable, editorial report assembled
 * deterministically from the Today engine. The essentials sit up top so the day is
 * readable in seconds; every module roll-up and secondary detail lives under a
 * collapsed "More" disclosure so the briefing stays scannable (UX pass 1). Only
 * Energy is editable inline; everything else is read-only.
 */
export function MorningBriefing() {
  const { identity } = useIdentity();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const flash = useMorningFlash((s) => s.flash);
  const timezone = identity?.preferences.timezone ?? "UTC";

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const state = trpc.today.getState.useQuery({});
  const focus = trpc.today.getFocus.useQuery({});
  const metrics = trpc.today.getMetrics.useQuery({});
  const notes = trpc.today.listNotes.useQuery({});
  const tasks = trpc.task.list.useQuery({ limit: 100 }, { staleTime: 60_000 });

  // The single highest-priority open task — what "Next Action" executes.
  const topTask = useMemo(() => {
    const open = selectOpen(tasks.data ?? []);
    return (
      [...open].sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])[0] ?? null
    );
  }, [tasks.data]);

  const focusLauncher = useFocusLauncher();
  const router = useRouter();
  const startNextAction = () => {
    if (topTask) {
      focusLauncher.startFocusOnTask(topTask.id, {
        ...(topTask.projectId ? { projectId: topTask.projectId } : {}),
        ...(topTask.estimatedMinutes ? { plannedMinutes: topTask.estimatedMinutes } : {}),
      });
    } else {
      router.push("/focus");
    }
  };

  const updateState = trpc.today.updateState.useMutation({
    onSuccess: () => utils.today.getState.invalidate(),
  });
  const completeMorning = trpc.today.completeMorning.useMutation({
    onSuccess: () => {
      utils.today.getState.invalidate();
      flash();
      toaster.success("Morning Complete ✓");
    },
  });
  // Decision engine drives "Today's Decision" (generates + reconciles on mount).
  const decisions = useDecisions({ generateOnMount: true });
  const [explainId, setExplainId] = useState<string | null>(null);

  // The "More" roll-ups each fetch their module's summary — keep them unmounted
  // until the user opens the disclosure so the briefing loads fast. A deep link
  // into one of those sections auto-expands it.
  const MORE_ANCHORS =
    /^#morning-(projects|journal|finance|goals|timeline|analytics|focus|notifications|automation|orchestration|knowledge|life|executive|resources|tomorrow|yesterday|sleep)/;
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    if (MORE_ANCHORS.test(window.location.hash)) setMoreOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const briefing: Briefing | null = useMemo(() => {
    if (!state.data || !focus.data || !metrics.data) return null;
    const workingHours = selectWorkingHours({
      state: state.data,
      preferredStartOfDay: identity?.preferences.preferredStartOfDay ?? null,
      preferredEndOfDay: identity?.preferences.preferredEndOfDay ?? null,
    });
    const pendingDecisions = decisions.decisions.filter((d) => d.state === "pending").length;
    return assembleMorningBriefing({
      now,
      timezone,
      name: identity?.preferences.displayName ?? null,
      state: state.data,
      focus: focus.data,
      metrics: metrics.data,
      workingHours,
      counts: { unreadInbox: 0, pendingDecisions, pendingNotes: (notes.data ?? []).length },
      yesterday: null,
    });
  }, [
    now,
    timezone,
    state.data,
    focus.data,
    metrics.data,
    notes.data,
    decisions.decisions,
    identity,
  ]);

  if (state.isLoading || focus.isLoading || metrics.isLoading || !briefing) {
    return <PageLoading label="Assembling your briefing…" />;
  }

  const setEnergy = (level: EnergyLevel) => updateState.mutate({ energyLevel: level });
  const morningDone = state.data?.morningCompleted ?? false;

  return (
    <PageContainer width="prose">
      <PageContent>
        <GreetingSection data={briefing.greeting} />

        <GetStartedCard />

        {/* ── The essentials: what to do today, and how you're set up for it. ── */}
        <MorningSection id="morning-energy" label="Energy Check">
          <EnergySection
            data={briefing.energy}
            onSetEnergy={setEnergy}
            pending={updateState.isPending}
          />
        </MorningSection>

        <HealthMorningSlot />

        <MorningSection label="Today's Mission">
          <MissionSection data={briefing.mission} />
        </MorningSection>

        <MorningSection label="Next Action">
          <NextActionSection
            data={briefing.nextAction}
            actionLabel={topTask ? `Focus on “${topTask.title}”` : "Start a focus session"}
            onAct={startNextAction}
          />
        </MorningSection>

        <MorningSection id="morning-recommendation" label="Today's Decision">
          <DecisionCard
            decision={decisions.current}
            pending={decisions.pending}
            onAccept={() => decisions.current && decisions.accept(decisions.current.id)}
            onDismiss={() => decisions.current && decisions.dismiss(decisions.current.id)}
            onDefer={(opt) => decisions.current && decisions.defer(decisions.current.id, opt)}
            onComplete={() => decisions.current && decisions.complete(decisions.current.id)}
            onWhy={() => setExplainId(decisions.current?.id ?? null)}
          />
        </MorningSection>

        <MorningSection id="morning-plan" label="Today's Plan">
          <MorningPlanSection />
        </MorningSection>

        <MorningSection id="morning-meetings" label="Today's Meetings">
          <MorningCalendarSection />
        </MorningSection>

        <MorningSection label="Calendar">
          <CalendarSection data={briefing.calendar} />
        </MorningSection>

        <MorningSection label="Focus Score">
          <FocusSection data={briefing.focus} />
        </MorningSection>

        {/* ── Everything else: collapsed + unmounted until opened (each roll-up
             fetches its own module summary, so mounting them all would slow the
             briefing to a crawl). ── */}
        <div className="border-border bg-elevated/40 mt-2 rounded-lg border">
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className="text-fg-muted hover:text-fg flex w-full cursor-pointer select-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
          >
            <span>More in today’s briefing</span>
            <span
              className={`text-fg-subtle transition-transform ${moreOpen ? "rotate-90" : ""}`}
              aria-hidden
            >
              ›
            </span>
          </button>
          {moreOpen ? (
            <div className="flex flex-col gap-6 px-4 pb-4 pt-1">
              <MorningSection label="Sleep">
                <SleepSection data={briefing.sleep} />
              </MorningSection>

              <MorningSection label="Remaining Day">
                <RemainingDaySection data={briefing.remainingDay} />
              </MorningSection>

              <MorningSection label="Workout">
                <WorkoutSection data={briefing.workout} />
              </MorningSection>

              <MorningSection label="Weather">
                <WeatherSection data={briefing.weather} />
              </MorningSection>

              <MorningSection id="morning-yesterday" label="Yesterday">
                <YesterdaySection data={briefing.yesterday} />
              </MorningSection>

              <MorningSection label="Notifications">
                <NotificationsSection data={briefing.notifications} />
              </MorningSection>

              <MorningSection id="morning-projects" label="Projects & Goals">
                <MorningProjectSection />
              </MorningSection>

              <MorningSection id="morning-journal" label="Journal">
                <MorningJournalSection />
              </MorningSection>

              <MorningSection id="morning-finance" label="Finance">
                <MorningFinanceSection />
              </MorningSection>

              <MorningSection id="morning-goals" label="Goals">
                <MorningGoalSection />
              </MorningSection>

              <MorningSection id="morning-timeline" label="Yesterday & Highlights">
                <MorningTimelineSection />
              </MorningSection>

              <MorningSection id="morning-analytics" label="Analytics">
                <MorningAnalyticsSection />
              </MorningSection>

              <MorningSection id="morning-focus" label="Deep Work">
                <MorningFocusSection />
              </MorningSection>

              <MorningSection id="morning-notifications" label="Notification Rules">
                <MorningNotificationSection />
              </MorningSection>

              <MorningSection id="morning-automation" label="Automation">
                <MorningAutomationSection />
              </MorningSection>

              <MorningSection id="morning-orchestration" label="System">
                <MorningOrchestrationSection />
              </MorningSection>

              <MorningSection id="morning-knowledge" label="Knowledge">
                <MorningKnowledgeSection />
              </MorningSection>

              <MorningSection id="morning-life" label="Life">
                <MorningLifeSection />
              </MorningSection>

              <MorningSection id="morning-executive" label="Executive Summary">
                <MorningExecutiveSection />
              </MorningSection>

              <MorningSection id="morning-resources" label="Resources">
                <MorningResourceSection />
              </MorningSection>

              <MorningSection id="morning-tomorrow" label="Tomorrow's Plan">
                <MorningTomorrowSection />
              </MorningSection>
            </div>
          ) : null}
        </div>

        <ClosingSection data={briefing.closing} />

        <div className="pb-12">
          <Button
            size="lg"
            className="w-full"
            variant={morningDone ? "secondary" : "primary"}
            disabled={morningDone}
            loading={completeMorning.isPending}
            leftIcon={morningDone ? <CheckCircle2 size={16} aria-hidden /> : undefined}
            onClick={() => completeMorning.mutate({})}
          >
            {morningDone ? "Morning complete" : "Complete Morning Briefing"}
          </Button>
        </div>

        <DecisionExplanationDialog
          decisionId={explainId}
          open={explainId !== null}
          onOpenChange={(next) => {
            if (!next) setExplainId(null);
          }}
        />
      </PageContent>
    </PageContainer>
  );
}
