"use client";

import { Badge, StatBlock, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { useResource } from "./use-resource";
import { InvestmentsPage } from "./InvestmentsPage";
import { AssetsPage } from "./AssetsPage";
import { MaintenanceTracker } from "./MaintenanceTracker";
import { VehiclesPage } from "./VehiclesPage";
import { InsurancePage } from "./InsurancePage";
import { DocumentsPage } from "./DocumentsPage";
import { TravelDocuments } from "./TravelDocuments";
import { RelationshipPage } from "./RelationshipPage";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { NetworkingView } from "./NetworkingView";
import { formatCountdown, formatGain, formatMoney } from "./resource-icons";

/**
 * ResourceDashboard (Sprint 4.3). The Resource & Relationship Platform's single surface.
 * The header portfolio is derived on every read — there is no stored net worth anywhere in
 * this platform, because a stored total is wrong by tomorrow.
 */
export function ResourceDashboard() {
  const r = useResource();

  if (r.isLoading) return <PageLoading label="Gathering your resources…" />;

  const portfolio = r.portfolio;

  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Everything you own, maintain and keep in touch with."
      />
      <PageContent>
        {portfolio ? (
          <div className="border-border-subtle flex flex-col gap-3 rounded-md border p-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <Text variant="display-m">{formatMoney(portfolio.netWorth)}</Text>
              <Text variant="caption" tone="subtle">
                net worth
              </Text>
              {r.investmentPortfolio && r.investmentPortfolio.costBasis > 0 ? (
                <Badge size="sm" variant={r.investmentPortfolio.gain >= 0 ? "success" : "danger"}>
                  {formatGain(r.investmentPortfolio.gain)} ({r.investmentPortfolio.gainPercent}%)
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-4">
              <StatBlock label="Investments" value={formatMoney(portfolio.investmentValue)} />
              <StatBlock label="Assets" value={formatMoney(portfolio.assetValue)} />
              <StatBlock label="Liabilities" value={formatMoney(portfolio.liabilities)} />
              <StatBlock label="Cover" value={formatMoney(portfolio.insuranceCoverage)} />
              <StatBlock label="Contacts" value={String(portfolio.relationshipCount)} />
              <StatBlock label="Strong" value={String(portfolio.strongRelationships)} />
              <StatBlock label="Dormant" value={String(portfolio.dormantRelationships)} />
            </div>
            {portfolio.upcomingRenewals.length > 0 || portfolio.upcomingBirthdays.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {portfolio.upcomingRenewals.slice(0, 3).map((item) => (
                  <Badge key={item.id} size="sm" variant={item.expired ? "danger" : "warning"}>
                    {item.name} {formatCountdown(item.daysUntil)}
                  </Badge>
                ))}
                {portfolio.upcomingBirthdays.slice(0, 3).map((b) => (
                  <Badge key={b.relationshipId} size="sm" variant="accent">
                    🎂 {b.name} {formatCountdown(b.daysUntil)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <Tabs defaultValue="investments">
          <TabsList>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="networking">Networking</TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            <InvestmentsPage
              accounts={r.accounts}
              positions={r.investments}
              portfolio={r.investmentPortfolio}
              onCreateAccount={r.createInvestmentAccount}
              onCreate={r.createInvestment}
              onUpdatePrice={r.updatePrice}
            />
          </TabsContent>

          <TabsContent value="assets">
            <AssetsPage
              assets={r.assets}
              onCreate={r.createAsset}
              onSelect={r.setSelectedAssetId}
              onDelete={r.deleteAsset}
              selectedId={r.selectedAssetId}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceTracker
              items={r.maintenance}
              assets={r.assets}
              onCreate={r.createMaintenance}
              onComplete={r.completeMaintenance}
            />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehiclesPage
              vehicles={r.vehicles}
              renewals={(r.portfolio?.upcomingRenewals ?? []).filter((x) => x.source === "vehicle")}
              onCreate={r.createVehicle}
            />
          </TabsContent>

          <TabsContent value="insurance">
            <InsurancePage
              policies={r.insurance}
              onCreate={r.createPolicy}
              onAddClaim={r.addClaim}
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsPage
              documents={r.documents}
              onCreate={r.createDocument}
              onRenew={r.renewDocument}
            />
          </TabsContent>

          <TabsContent value="travel">
            <TravelDocuments documents={r.travel} onCreate={r.createTravelDocument} />
          </TabsContent>

          <TabsContent value="people">
            <div className="flex flex-col gap-4">
              <RelationshipPage
                relationships={r.relationships}
                health={r.relationshipHealth}
                interactions={r.interactions}
                selectedId={r.selectedRelationshipId}
                onSelect={r.setSelectedRelationshipId}
                onCreate={r.createRelationship}
                onLogInteraction={r.logInteraction}
                onSetFollowUp={r.setFollowUp}
              />
              <div className="flex flex-col gap-2">
                <Text variant="caption" tone="subtle">
                  BIRTHDAYS & ANNIVERSARIES
                </Text>
                <BirthdayCalendar dates={r.allDates} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="networking">
            <NetworkingView
              relationships={r.relationships}
              events={r.relationshipEvents}
              onLogEvent={r.logRelationshipEvent}
            />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}
