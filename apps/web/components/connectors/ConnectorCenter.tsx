"use client";

import { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

/**
 * Connector Center (Sprint 6.4, Phase 6). The External Ecosystem surface: connect external services
 * (Google Calendar, Gmail, GitHub, Drive, Slack, Weather), sync them, and watch their NORMALIZED
 * events flow into the same Event Intelligence → Prediction → Automation → Chief pipeline. Connectors
 * synchronize and normalize only — they never interpret. Credentials are encrypted (AES-256-GCM),
 * never shown, never reachable by the AI. Read-first. This screen only reads/triggers; the intelligence
 * stack is unchanged downstream.
 */

type Provider = RouterOutputs["connectors"]["list"]["providers"][number];

const STATE: Record<string, "success" | "danger" | "warning" | "accent" | "neutral"> = {
  healthy: "success",
  connected: "accent",
  syncing: "accent",
  warning: "warning",
  failed: "danger",
  authenticating: "warning",
  disconnected: "neutral",
};

const CATEGORY_LABEL: Record<string, string> = {
  calendar: "Calendar",
  email: "Email",
  code: "Code",
  storage: "Storage",
  chat: "Chat",
  weather: "Weather",
};

export function ConnectorCenter() {
  return (
    <PageContainer>
      <PageHeader
        title="Connectors"
        description="External services become normalized event sources. Connectors synchronize and normalize — the Event Engine decides what matters. Credentials are encrypted and never reachable by the AI. Read-first."
      />
      <PageContent>
        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="syncs">Sync Jobs</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="services">
            <Services />
          </TabsContent>
          <TabsContent value="health">
            <Health />
          </TabsContent>
          <TabsContent value="activity">
            <Activity />
          </TabsContent>
          <TabsContent value="syncs">
            <SyncJobs />
          </TabsContent>
          <TabsContent value="metrics">
            <Metrics />
          </TabsContent>
          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
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

function ConnectorCard({ p, onDone }: { p: Provider; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const connect = trpc.connectors.connect.useMutation();
  const disconnect = trpc.connectors.disconnect.useMutation();
  const sync = trpc.connectors.sync.useMutation();
  const busy = connect.isPending || disconnect.isPending || sync.isPending;
  const account = p.accounts[0];

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Text variant="body-m" className="truncate">
            {p.name}
          </Text>
          <Badge variant="neutral">{CATEGORY_LABEL[p.category] ?? p.category}</Badge>
          {p.readOnly ? <Badge variant="neutral">read-only</Badge> : null}
        </div>
        <div className="flex items-center gap-1.5">
          {account ? (
            <Badge variant={STATE[account.state] ?? "neutral"}>{account.state}</Badge>
          ) : (
            <Badge variant="neutral">not connected</Badge>
          )}
        </div>
      </div>
      <Text variant="body-s" className="text-fg-muted">
        {p.auth} · {p.syncStrategy}
        {p.webhookCapable ? " · webhooks" : ""} · emits {p.supportedEvents.length} event types
      </Text>
      {account?.lastSyncAt ? (
        <Text variant="body-s" className="text-fg-muted">
          Last sync: {new Date(account.lastSyncAt).toLocaleString()}
        </Text>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide permissions" : "Permissions"}
        </Button>
        {p.connected && account ? (
          <>
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() =>
                sync.mutate({ accountId: account.id, trigger: "manual" }, { onSuccess: onDone })
              }
            >
              Sync now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => disconnect.mutate({ accountId: account.id }, { onSuccess: onDone })}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => connect.mutate({ providerId: p.id }, { onSuccess: onDone })}
          >
            Connect
          </Button>
        )}
        {sync.data ? (
          <Text variant="body-s" className={sync.data.ok ? "text-success" : "text-warning"}>
            {sync.data.ok
              ? `Synced — ${sync.data.events.length} event${sync.data.events.length === 1 ? "" : "s"}${sync.data.dropped ? `, ${sync.data.dropped} deduped` : ""}`
              : "Sync unavailable."}
          </Text>
        ) : null}
      </div>
      {open ? (
        <div className="border-border bg-elevated mt-2 flex flex-col gap-1 rounded border p-3">
          <Text variant="body-s" className="text-fg-muted">
            Requested scopes (least-privilege, read-first)
          </Text>
          {p.permissions.map((perm) => (
            <Text key={perm} variant="body-s">
              • {perm}
            </Text>
          ))}
          <Text variant="body-s" className="text-fg-muted mt-1">
            Normalized events: {p.supportedEvents.join(", ")}
          </Text>
        </div>
      ) : null}
    </Card>
  );
}

function Services() {
  const q = trpc.connectors.list.useQuery();
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  const refresh = () => void utils.connectors.invalidate();
  return q.data ? (
    <div className="flex flex-col gap-2">
      <Text variant="body-s" className="text-fg-muted">
        {q.data.connectedCount} connected · {q.data.providers.length} available. Sync runs offline
        by default — no keys required to see the pipeline work end-to-end.
      </Text>
      {q.data.providers.map((p) => (
        <ConnectorCard key={p.id} p={p} onDone={refresh} />
      ))}
    </div>
  ) : (
    <Empty text="No providers registered." />
  );
}

function Health() {
  const q = trpc.connectors.health.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.items.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.items.map((h) => (
        <Card key={h.accountId} className="flex items-center justify-between gap-2 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Text variant="body-m" className="truncate">
                {h.label}
              </Text>
              <Badge variant={STATE[h.state] ?? "neutral"}>{h.state}</Badge>
            </div>
            <Text variant="body-s" className="text-fg-muted">
              {h.reasons.length > 0 ? h.reasons.join(" · ") : "All good"}
              {h.lastSyncAt ? ` · synced ${new Date(h.lastSyncAt).toLocaleString()}` : ""}
            </Text>
          </div>
          <Text
            variant="heading-s"
            className={
              h.score >= 70 ? "text-success" : h.score >= 30 ? "text-warning" : "text-danger"
            }
          >
            {h.score}
          </Text>
        </Card>
      ))}
    </div>
  ) : (
    <Empty text="No connected services yet. Connect one on the Services tab to see its health here." />
  );
}

function Activity() {
  const q = trpc.connectors.events.useQuery(undefined);
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.events.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.events.map((e, i) => (
        <Card key={`${e.externalId}-${i}`} className="flex items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <Text variant="body-m" className="truncate">
              {String(e.payload.label ?? e.kind)}
            </Text>
            <Text variant="body-s" className="text-fg-muted">
              {e.providerKey} → {e.kind}
            </Text>
          </div>
          <Text variant="body-s" className="text-fg-muted">
            {new Date(e.occurredAt).toLocaleString()}
          </Text>
        </Card>
      ))}
    </div>
  ) : (
    <Empty text="No normalized events yet. Sync a connected service — its external changes become normalized events here, then flow into Signals." />
  );
}

function SyncJobs() {
  const q = trpc.connectors.syncHistory.useQuery(undefined);
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.history.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.history.map((h, i) => (
        <Card key={i} className="flex items-center justify-between gap-2 p-3">
          <div>
            <Text variant="body-s">
              {h.eventsProcessed} events{h.dropped ? ` · ${h.dropped} deduped` : ""} ·{" "}
              {Math.round(h.durationMs)}ms
            </Text>
            <Text variant="body-s" className="text-fg-muted">
              {new Date(h.at).toLocaleString()}
            </Text>
          </div>
          <Badge variant={h.ok ? "success" : "danger"}>{h.ok ? "ok" : "failed"}</Badge>
        </Card>
      ))}
    </div>
  ) : (
    <Empty text="No sync runs yet." />
  );
}

function Metrics() {
  const q = trpc.connectors.metrics.useQuery();
  if (q.isLoading) return <PageLoading />;
  const t = q.data?.totals;
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
      {metric("Syncs", t?.syncs ?? 0)}
      {metric("Events processed", t?.eventsProcessed ?? 0)}
      {metric("Failures", t?.failures ?? 0)}
      {metric("Retries", t?.retries ?? 0)}
      {metric("Avg sync", `${Math.round(t?.avgSyncMs ?? 0)}ms`)}
      {metric("Rate-limit hits", t?.rateLimitHits ?? 0)}
    </div>
  );
}

function Settings() {
  const q = trpc.connectors.settings.useQuery();
  if (q.isLoading) return <PageLoading />;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Connector platform</Text>
      <Text variant="body-s" className="text-fg-muted">
        Every connector is read-first and provider-agnostic. Credentials are encrypted with
        AES-256-GCM, stored server-side only, and are never returned through the API or reachable by
        any AI provider. Sync runs offline by default; live OAuth activates when credentials are
        present.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-border bg-elevated rounded border px-4 py-2">
          <Text variant="body-s" className="text-fg-muted">
            Providers
          </Text>
          <Text variant="heading-s">{q.data?.providers ?? 0}</Text>
        </div>
        <div className="border-border bg-elevated rounded border px-4 py-2">
          <Text variant="body-s" className="text-fg-muted">
            Connected
          </Text>
          <Text variant="heading-s">{q.data?.connected ?? 0}</Text>
        </div>
        <div className="border-border bg-elevated rounded border px-4 py-2">
          <Text variant="body-s" className="text-fg-muted">
            Mode
          </Text>
          <Text variant="heading-s">{q.data?.offlineDefault ? "Offline default" : "Live"}</Text>
        </div>
      </div>
    </Card>
  );
}
