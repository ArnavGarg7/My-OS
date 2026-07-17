"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { useIntelligence } from "./use-intelligence";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { AttentionPanel } from "./AttentionPanel";
import { LifeAreas } from "./LifeAreas";
import { Scorecards } from "./Scorecards";
import { Trends } from "./Trends";
import { PriorityMatrix } from "./PriorityMatrix";
import { Milestones } from "./Milestones";
import { Achievements } from "./Achievements";
import { Reviews } from "./Reviews";
import { Reports } from "./Reports";
import { Collections } from "./Collections";
import { DashboardSettings } from "./DashboardSettings";
import { DashboardLayout } from "./DashboardLayout";

/**
 * Dashboard (Sprint 4.4). The executive layer — a single view over every deterministic
 * subsystem. Everything here is COMPOSED from read models the owning modules produced; the
 * dashboard computes nothing. The Wheel of Life is the one heavy visualization, so it is
 * lazy-loaded (dynamic import, client-only) to keep the initial payload small.
 */
const WheelOfLife = dynamic(() => import("./WheelOfLife").then((m) => m.WheelOfLife), {
  ssr: false,
  loading: () => <PageLoading label="Drawing the wheel…" />,
});

export function Dashboard() {
  const i = useIntelligence();

  if (i.isLoading) return <PageLoading label="Composing your dashboard…" />;

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="How your whole life is progressing." />
      <PageContent>
        <ExecutiveSummary summary={i.dashboard?.summary} />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scorecards">Scorecards</TabsTrigger>
            <TabsTrigger value="attention">Attention</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-2">
              <DashboardLayout title="Wheel of Life">
                <WheelOfLife slices={i.wheel} />
              </DashboardLayout>
              <DashboardLayout title="Life areas">
                <LifeAreas areas={i.lifeAreas} />
              </DashboardLayout>
            </div>
          </TabsContent>

          <TabsContent value="scorecards">
            <Scorecards cards={i.scorecards} />
          </TabsContent>

          <TabsContent value="attention">
            <div className="grid gap-4 lg:grid-cols-2">
              <DashboardLayout title="Needs attention">
                <AttentionPanel items={i.attention} />
              </DashboardLayout>
              <DashboardLayout title="Priority matrix">
                <PriorityMatrix items={i.matrix} />
              </DashboardLayout>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <DashboardLayout title="Trends">
              <Trends trends={i.trends} />
            </DashboardLayout>
          </TabsContent>

          <TabsContent value="milestones">
            <div className="grid gap-4 lg:grid-cols-2">
              <DashboardLayout title="Milestones">
                <Milestones milestones={i.milestones} />
              </DashboardLayout>
              <DashboardLayout title="Achievements">
                <Achievements achievements={i.achievements} />
              </DashboardLayout>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="grid gap-4 lg:grid-cols-2">
              <DashboardLayout title="Reviews">
                <Reviews reviews={i.reviews} onGenerate={i.generateReview} />
              </DashboardLayout>
              <DashboardLayout title="Reports">
                <Reports reports={i.reports} onGenerate={i.generateReport} />
              </DashboardLayout>
            </div>
          </TabsContent>

          <TabsContent value="collections">
            <Collections
              collections={i.collections}
              onCreate={i.createCollection}
              onDelete={i.deleteCollection}
            />
          </TabsContent>

          <TabsContent value="settings">
            <DashboardSettings preferences={i.preferences} onSave={i.savePreferences} />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}
