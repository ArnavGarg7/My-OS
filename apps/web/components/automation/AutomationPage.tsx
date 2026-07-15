"use client";

import { PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { useAutomation } from "./use-automation";
import { AutomationFilters } from "./AutomationFilters";
import { AutomationList } from "./AutomationList";
import { AutomationEditor } from "./AutomationEditor";
import { AutomationInspector } from "./AutomationInspector";
import { AutomationHistory } from "./AutomationHistory";
import { AutomationStatistics } from "./AutomationStatistics";

/**
 * AutomationPage (Sprint 3.4). The /automation route — where My OS runs itself. A
 * readable, editorial rule center: rules list + inspector, a create editor, execution
 * history and portfolio statistics. Deterministic; no node graph.
 */
export function AutomationPage() {
  const a = useAutomation();

  if (a.isLoading && a.allRules.length === 0) {
    return <PageLoading label="Loading automations…" />;
  }

  const toggle = (rule: { id: string; status: string }) =>
    rule.status === "enabled" ? a.disable(rule.id) : a.enable(rule.id);

  return (
    <PageContainer>
      <PageHeader title="Automation" description="Deterministic rules that run your OS for you." />

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <AutomationFilters view={a.view} onChange={a.setView} />
              <AutomationList
                rules={a.rules}
                selectedId={a.selectedId}
                onSelect={a.setSelectedId}
                onToggle={(rule) => toggle(rule)}
                onExecute={a.execute}
                onDelete={a.remove}
              />
            </div>
            <div>
              {a.selected ? (
                <AutomationInspector
                  rule={a.selected}
                  onToggle={() => toggle(a.selected!)}
                  onExecute={() => a.execute(a.selected!.id)}
                  onPreview={() => a.preview(a.selected!.id)}
                />
              ) : (
                <p className="text-fg-subtle text-sm">Select a rule to inspect it.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="max-w-xl">
            <AutomationEditor onCreate={a.create} pending={a.pending} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <AutomationHistory records={a.history} />
        </TabsContent>

        <TabsContent value="stats">
          {a.portfolio ? <AutomationStatistics portfolio={a.portfolio} /> : null}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
