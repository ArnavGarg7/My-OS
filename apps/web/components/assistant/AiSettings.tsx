"use client";

import { Badge, Card, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";

/**
 * AI Settings + Provider Dashboard (Sprint 5.3). The owner-facing view of the AI layer: which
 * providers are configured and healthy, the active tier/budget/policy, and how credentials are set
 * up. API keys are read server-side from env and NEVER returned here — this page only shows
 * configured/health status. The Local provider is always the offline fallback, so everything works
 * with no keys at all.
 */
export function AiSettings() {
  const providers = trpc.assistant.providers.useQuery();
  const settings = trpc.assistant.settings.useQuery();

  if (providers.isLoading || settings.isLoading) return <PageLoading />;

  const s = settings.data?.settings;

  return (
    <PageContainer>
      <PageHeader
        title="AI Settings"
        description="Providers, budget, and privacy for your conversational Chief of Staff. Keys live in your server environment and are never shown here."
      />
      <PageContent>
        <div className="flex flex-col gap-5">
          <ProviderDashboard providers={providers.data ?? []} />
          {s ? <SettingsSummary settings={s} /> : null}
          <CredentialSetup />
        </div>
      </PageContent>
    </PageContainer>
  );
}

const STATE_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  healthy: "success",
  degraded: "warning",
  unavailable: "neutral",
};

type ProviderRow = {
  provider: string;
  configured: boolean;
  state: string;
  detail: string;
};

function ProviderDashboard({ providers }: { providers: ProviderRow[] }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Providers</Text>
      <Text variant="body-s" className="text-fg-muted">
        Anthropic, Gemini, Groq and Local are fully interchangeable through the Provider Policy. A
        provider activates automatically once its key is present in the environment and its health
        check passes.
      </Text>
      <div className="divide-border flex flex-col divide-y">
        {providers.map((p) => (
          <div key={p.provider} className="flex items-center justify-between py-3">
            <div className="flex flex-col">
              <Text variant="body-m" className="capitalize">
                {p.provider}
              </Text>
              <Text variant="body-s" className="text-fg-muted">
                {p.detail}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.configured ? "accent" : "neutral"}>
                {p.configured ? "key configured" : "no key"}
              </Badge>
              <Badge variant={STATE_VARIANT[p.state] ?? "neutral"}>{p.state}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SettingsSummary({
  settings,
}: {
  settings: {
    tier: string;
    softDailyUsd: number;
    hardDailyUsd: number;
    journalInContext: boolean;
    localOnly: boolean;
    memoryProposalsEnabled: boolean;
  };
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Policy & budget</Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Active tier" value={settings.tier} />
        <Field label="Soft daily budget" value={`$${settings.softDailyUsd.toFixed(2)}`} />
        <Field label="Hard daily budget" value={`$${settings.hardDailyUsd.toFixed(2)}`} />
        <Field label="Journal in context" value={settings.journalInContext ? "on" : "off"} />
        <Field label="Local only" value={settings.localOnly ? "on" : "off"} />
        <Field label="Memory proposals" value={settings.memoryProposalsEnabled ? "on" : "off"} />
      </div>
      <Text variant="body-s" className="text-fg-muted">
        Permanent memories always require your confirmation. Every data change stays a proposal
        until you accept it.
      </Text>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-elevated rounded border p-3">
      <Text variant="body-s" className="text-fg-muted">
        {label}
      </Text>
      <Text variant="heading-s" className="capitalize">
        {value}
      </Text>
    </div>
  );
}

function CredentialSetup() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Configuring API keys</Text>
      <Text variant="body-s" className="text-fg-muted">
        Keys are read only by the server-side provider layer. They are never committed to Git, never
        logged, and never exposed to the browser. To enable a cloud provider, add its key to your
        local <code className="bg-elevated rounded px-1">.env</code> (which is gitignored) and
        restart the server:
      </Text>
      <pre className="bg-elevated border-border overflow-x-auto rounded border p-3 text-xs">
        {`# apps/web/.env  (never commit this file)
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENAI_API_KEY=...

# used to encrypt any credentials stored server-side
MYOS_AI_CREDENTIALS_SECRET=...`}
      </pre>
      <Text variant="body-s" className="text-fg-muted">
        No key? The Chief still works fully offline on the Local provider — it just reasons
        deterministically instead of calling a cloud model.
      </Text>
    </Card>
  );
}
