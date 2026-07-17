"use client";

import {
  Badge,
  PageHeader,
  StatBlock,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { useLife } from "./use-life";
import { HabitsPage } from "./HabitsPage";
import { RoutinePage } from "./RoutinePage";
import { MedicationTracker } from "./MedicationTracker";
import { SupplementTracker } from "./SupplementTracker";
import { WorkoutPrograms } from "./WorkoutPrograms";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { BodyComposition } from "./BodyComposition";
import { InjuryLog } from "./InjuryLog";
import { DoctorAppointments } from "./DoctorAppointments";
import { PersonalGrowth } from "./PersonalGrowth";
import { RECOMMENDATION_BADGE, RECOMMENDATION_LABEL, ReadinessIcon } from "./life-icons";

/**
 * LifeDashboard (Sprint 4.2). The /life route — My OS as a Personal Life Operating
 * System. Readiness header + portfolio, then tabs for habits, routines, health, growth.
 * Editorial; reuses the design system. Deterministic throughout.
 */
export function LifeDashboard() {
  const life = useLife();

  if (life.isLoading && life.habits.length === 0 && !life.summary) {
    return <PageLoading label="Loading your life platform…" />;
  }

  const r = life.readiness;

  return (
    <PageContainer>
      <PageHeader
        title="Life"
        description="Your personal life OS — habits, routines, health, and who you're becoming."
      />

      {r ? (
        <div className="border-border-subtle flex flex-wrap items-center gap-4 rounded-md border p-4">
          <span className="flex items-center gap-2">
            <ReadinessIcon size={18} aria-hidden className="text-success" />
            <Text variant="heading-m">{r.score}</Text>
            <Text variant="caption" tone="subtle">
              readiness
            </Text>
          </span>
          <Badge size="sm" variant={RECOMMENDATION_BADGE[r.trainingRecommendation]}>
            Train: {RECOMMENDATION_LABEL[r.trainingRecommendation]}
          </Badge>
          <Badge size="sm" variant={RECOMMENDATION_BADGE[r.workRecommendation]}>
            Work: {RECOMMENDATION_LABEL[r.workRecommendation]}
          </Badge>
          <Badge size="sm" variant={RECOMMENDATION_BADGE[r.studyRecommendation]}>
            Study: {RECOMMENDATION_LABEL[r.studyRecommendation]}
          </Badge>
          <Text variant="caption" tone="subtle">
            Recovery {r.recovery} · Risk {r.risk}
          </Text>
        </div>
      ) : null}

      {life.portfolio ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatBlock label="Habits" value={String(life.portfolio.activeHabits)} />
          <StatBlock label="Best streak" value={String(life.portfolio.bestStreak)} />
          <StatBlock label="Routines" value={String(life.portfolio.activeRoutines)} />
          <StatBlock label="Meds" value={String(life.portfolio.activeMedications)} />
          <StatBlock label="Workouts/wk" value={String(life.portfolio.workoutsThisWeek)} />
          <StatBlock label="Vision" value={String(life.portfolio.visionItems)} />
        </div>
      ) : null}

      <Tabs defaultValue="habits">
        <TabsList>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="routines">Routines</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="habits">
          <HabitsPage life={life} />
        </TabsContent>
        <TabsContent value="routines">
          <RoutinePage life={life} />
        </TabsContent>
        <TabsContent value="workouts">
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkoutPrograms workouts={life.workouts} onLog={life.logWorkout} />
            <ExerciseLibrary workouts={life.workouts} />
          </div>
        </TabsContent>
        <TabsContent value="health">
          <div className="grid gap-6 lg:grid-cols-2">
            <MedicationTracker
              medications={life.medications}
              onAdd={life.createMedication}
              onLog={life.logMedication}
            />
            <SupplementTracker supplements={life.supplements} onAdd={life.createSupplement} />
            <InjuryLog injuries={life.injuries} onAdd={life.createInjury} />
            <DoctorAppointments
              appointments={life.appointments}
              onAdd={life.createAppointment}
              onComplete={life.completeAppointment}
            />
          </div>
        </TabsContent>
        <TabsContent value="body">
          <BodyComposition body={life.body} onLog={life.logBody} />
        </TabsContent>
        <TabsContent value="growth">
          <PersonalGrowth
            vision={life.vision}
            reviews={life.reviews}
            onAddVision={life.createVision}
            onStartReview={life.createReview}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
