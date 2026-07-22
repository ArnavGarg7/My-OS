"use client";

import { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

/**
 * Autopilot Center (Sprint 6.3, Phase 6). The Proposal-First Automation Engine surface: review
 * proposals derived from Signals + Predictions, see each one's execution plan + rollback, approve or
 * reject, watch verified execution, and govern per-automation policies. Every mutation is
 * proposal-gated and reversible — the OS never performs unexpected work, and the AI never executes.
 */

type Proposal = RouterOutputs["autopilot"]["list"]["pending"][number];

const RISK: Record<string, "danger" | "warning" | "success"> = {
  high: "danger",
  medium: "warning",
  low: "success",
};
const STATE: Record<string, "success" | "danger" | "warning" | "accent" | "neutral"> = {
  completed: "success",
  rolled_back: "warning",
  failed: "danger",
  rejected: "neutral",
  executing: "accent",
  approved: "accent",
  pending_approval: "warning",
};

export function AutopilotCenter() {
  return (
    <PageContainer>
      <PageHeader
        title="Autopilot"
        description="Proposal-first automation — Signals and predictions become reviewable, reversible proposals. Nothing runs without your approval (or an explicit trusted policy). The AI never executes."
      />
      <PageContent>
        <Tabs defaultValue="proposals">
          <TabsList>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="proposals">
            <Proposals />
          </TabsContent>
          <TabsContent value="active">
            <Active />
          </TabsContent>
          <TabsContent value="history">
            <History />
          </TabsContent>
          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

function ExecutionPlanView({ plan }: { plan: Proposal["plan"] }) {
  const steps =
    (
      plan as {
        steps?: { order: number; action: { label: string }; rollback: { label: string } | null }[];
      }
    ).steps ?? [];
  return (
    <div className="border-border bg-elevated mt-2 flex flex-col gap-1 rounded border p-3">
      <Text variant="body-s" className="text-fg-muted">
        Execution plan
      </Text>
      {steps.map((s) => (
        <div key={s.order} className="flex items-center justify-between">
          <Text variant="body-s">
            {s.order}. {s.action.label}
          </Text>
          {s.rollback ? (
            <Text variant="body-s" className="text-fg-muted">
              ↩ {s.rollback.label}
            </Text>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProposalCard({ p, onDone }: { p: Proposal; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const approve = trpc.autopilot.approve.useMutation();
  const reject = trpc.autopilot.reject.useMutation();
  const execute = trpc.autopilot.execute.useMutation();
  const rollback = trpc.autopilot.rollback.useMutation();
  const busy = approve.isPending || reject.isPending || execute.isPending || rollback.isPending;

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={STATE[p.state] ?? "neutral"}>{p.state.replace(/_/g, " ")}</Badge>
          <Text variant="body-m" className="truncate">
            {p.title}
          </Text>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={RISK[p.risk] ?? "neutral"}>{p.risk} risk</Badge>
          {p.policy === "trusted" ? <Badge variant="accent">trusted</Badge> : null}
        </div>
      </div>
      <Text variant="body-s" className="text-fg-muted">
        {p.reason}
      </Text>
      <Text variant="body-s">
        Expected: {p.expectedBenefit} · Rollback: {p.rollbackSummary}
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide plan" : "View plan"}
        </Button>
        {p.state === "pending_approval" ? (
          <>
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() =>
                approve.mutate(
                  { proposalId: p.id },
                  { onSuccess: () => execute.mutate({ proposalId: p.id }, { onSuccess: onDone }) },
                )
              }
            >
              Approve & run
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => reject.mutate({ proposalId: p.id }, { onSuccess: onDone })}
            >
              Reject
            </Button>
          </>
        ) : null}
        {p.state === "completed" ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => rollback.mutate({ proposalId: p.id }, { onSuccess: onDone })}
          >
            Roll back
          </Button>
        ) : null}
        {execute.data && !execute.data.ok ? (
          <Text variant="body-s" className="text-warning">
            {execute.data.rolledBack ? "Failed — rolled back automatically." : "Could not execute."}
          </Text>
        ) : null}
      </div>
      {open ? <ExecutionPlanView plan={p.plan} /> : null}
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="p-6">
      <Text variant="body-m" className="text-fg-muted">
        {text}
      </Text>
    </Card>
  );
}

function Proposals() {
  const q = trpc.autopilot.proposals.useQuery(undefined, { refetchInterval: 300_000 });
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  const refresh = () => void utils.autopilot.invalidate();
  return q.data && q.data.proposals.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.proposals.map((p) => (
        <ProposalCard key={p.id} p={p} onDone={refresh} />
      ))}
    </div>
  ) : (
    <Empty text="No proposals right now. When a signal or forecast suggests safe, reversible work, it appears here for your approval." />
  );
}

function Active() {
  const q = trpc.autopilot.list.useQuery();
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  const refresh = () => void utils.autopilot.invalidate();
  return q.data && q.data.active.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.active.map((p) => (
        <ProposalCard key={p.id} p={p} onDone={refresh} />
      ))}
    </div>
  ) : (
    <Empty text="Nothing executing. Approved proposals run here and are verified before completing." />
  );
}

function History() {
  const q = trpc.autopilot.history.useQuery();
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  const refresh = () => void utils.autopilot.invalidate();
  return q.data && q.data.proposals.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.proposals.map((p) => (
        <ProposalCard key={p.id} p={p} onDone={refresh} />
      ))}
    </div>
  ) : (
    <Empty text="No completed automations yet. Every execution is auditable and reversible." />
  );
}

function Analytics() {
  const q = trpc.autopilot.analytics.useQuery();
  if (q.isLoading) return <PageLoading />;
  const a = q.data;
  const metric = (label: string, value: number | string) => (
    <div className="border-border bg-elevated rounded border px-4 py-2">
      <Text variant="body-s" className="text-fg-muted">
        {label}
      </Text>
      <Text variant="heading-s">{value}</Text>
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      {metric("Proposals", a?.proposals ?? 0)}
      {metric("Executed", a?.executed ?? 0)}
      {metric("Rolled back", a?.rolledBack ?? 0)}
      {metric("Approval rate", `${Math.round((a?.approvalRate ?? 0) * 100)}%`)}
      {metric("Success rate", `${Math.round((a?.executionSuccessRate ?? 0) * 100)}%`)}
      {metric("Trusted usage", a?.trustedUsage ?? 0)}
    </div>
  );
}

const POLICIES = ["always_ask", "ask_once", "trusted", "disabled"] as const;

function Settings() {
  const q = trpc.autopilot.settings.useQuery();
  const setPolicy = trpc.autopilot.setPolicy.useMutation();
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Automation policies</Text>
      <Text variant="body-s" className="text-fg-muted">
        Trust is only available for low-risk, reversible automations. Everything else always asks.
      </Text>
      <div className="divide-border flex flex-col divide-y">
        {q.data?.automations.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <Text variant="body-m">{a.name}</Text>
              <Text variant="body-s" className="text-fg-muted">
                {a.description}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={RISK[a.risk] ?? "neutral"}>{a.risk}</Badge>
              <select
                className="border-border bg-base rounded border p-1 text-sm"
                value={a.policy}
                onChange={(e) =>
                  setPolicy.mutate(
                    { automationId: a.id, policy: e.target.value as (typeof POLICIES)[number] },
                    { onSuccess: () => void utils.autopilot.settings.invalidate() },
                  )
                }
              >
                {POLICIES.map((p) => (
                  <option key={p} value={p} disabled={p === "trusted" && !a.trustable}>
                    {p.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
