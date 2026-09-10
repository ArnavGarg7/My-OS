"use client";

import { Lock, ShieldCheck, Bot, Plug } from "lucide-react";
import { Badge, Card, MonoLabel, Text } from "@myos/ui";
import { PageContainer, PageHeader } from "@/components/framework";
import {
  DOMAIN_CLASSIFICATION,
  AI_SAFE_SURFACES,
  type DataClass,
} from "@/lib/security/classification";

/**
 * Privacy & Security transparency (Stage C / Part D). Generated from the data-classification registry
 * so it can't drift from the truth: every persisted domain, its sensitivity tier, whether it's
 * encrypted at rest, and what an external AI model can see. Principle: never require blind trust.
 */

// Schema files whose `private` free-text bodies are encrypted at rest (Stage C, Tier 1).
const ENCRYPTED_BODIES = new Set(["journal.ts", "knowledge.ts", "inbox.ts", "collaboration.ts"]);
// Schema files whose secrets are sealed in a dedicated AES-256-GCM vault.
const VAULTED = new Set(["connectors.ts", "ai.ts"]);

const CLASS_LABEL: Record<DataClass, string> = {
  public: "Shareable",
  internal: "Operational",
  sensitive: "Sensitive",
  private: "Private",
};
const CLASS_TONE: Record<DataClass, "neutral" | "info" | "warning" | "danger"> = {
  public: "neutral",
  internal: "info",
  sensitive: "warning",
  private: "danger",
};

function domainName(file: string): string {
  return file
    .replace(/\.ts$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function encryptionFor(file: string): { label: string; encrypted: boolean } {
  if (VAULTED.has(file)) return { label: "Vaulted (AES-256-GCM)", encrypted: true };
  if (ENCRYPTED_BODIES.has(file)) return { label: "Encrypted at rest", encrypted: true };
  return { label: "Plaintext", encrypted: false };
}

export function PrivacyCenter() {
  const rows = [...DOMAIN_CLASSIFICATION].sort((a, b) => a.file.localeCompare(b.file));

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<MonoLabel tone="subtle">System · Privacy &amp; Security</MonoLabel>}
        title="Privacy &amp; Security"
        description="Exactly what My OS stores, how each kind of data is protected, and what ever leaves to an external AI. Generated from the data-classification registry — it can't drift from the truth."
      />

      <div className="flex flex-col gap-4">
        {/* Encryption tiers */}
        <Card variant="standard" padding="lg" className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-fg-subtle" aria-hidden />
            <MonoLabel tone="subtle">Encryption</MonoLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TierCard
              tone="success"
              title="Vaulted"
              body="Credentials — connector + AI tokens — are sealed with AES-256-GCM and never returned by any API or reachable by the AI."
            />
            <TierCard
              tone="success"
              title="Encrypted at rest"
              body="Private free-text bodies (journal, notes, inbox captures, messages) are encrypted in the database. A stolen backup holds only ciphertext; the app decrypts to run features."
            />
            <TierCard
              tone="muted"
              title="End-to-end (planned)"
              body="Opt-in server-blind encryption for the most private notes — search &amp; AI turn off for that data. Coming in a later pass."
            />
          </div>
        </Card>

        {/* AI boundary */}
        <Card variant="standard" padding="lg" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Bot size={15} className="text-fg-subtle" aria-hidden />
            <MonoLabel tone="subtle">What the AI can see</MonoLabel>
          </div>
          <Text variant="body-s" tone="muted">
            Raw <strong>sensitive</strong> and <strong>private</strong> rows are never sent to an
            external AI model. Only these deterministic, de-identified summary surfaces may cross
            the boundary — and a Local (offline) model is always the fallback.
          </Text>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {AI_SAFE_SURFACES.map((s) => (
              <Badge key={s} variant="outline" size="sm">
                {s}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Connectors */}
        <Card variant="standard" padding="lg" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Plug size={15} className="text-fg-subtle" aria-hidden />
            <MonoLabel tone="subtle">Connectors</MonoLabel>
          </div>
          <Text variant="body-s" tone="muted">
            External connectors are <strong>read-first</strong> with least-privilege scopes; their
            OAuth tokens are vaulted server-side and never reach the AI. They only answer
            &ldquo;what changed?&rdquo; — normalized events, never raw account contents beyond what
            a scope grants. Disconnecting deletes the token and its events.
          </Text>
        </Card>

        {/* Per-domain table */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-fg-subtle" aria-hidden />
            <MonoLabel tone="subtle">Every data domain ({rows.length})</MonoLabel>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="text-label text-fg-subtle border-border border-b">
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Sensitivity</th>
                  <th className="px-3 py-2 font-medium">At rest</th>
                  <th className="px-3 py-2 font-medium">AI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const enc = encryptionFor(d.file);
                  return (
                    <tr key={d.file} className="border-border/60 border-b">
                      <td className="px-3 py-2">
                        <Text variant="body-s">{domainName(d.file)}</Text>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={CLASS_TONE[d.level]} size="sm">
                          {CLASS_LABEL[d.level]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Text variant="caption" tone={enc.encrypted ? "success" : "subtle"}>
                          {enc.label}
                        </Text>
                      </td>
                      <td className="px-3 py-2">
                        <Text variant="caption" tone="subtle">
                          {d.rawAiSafe ? "raw ok" : "summaries only"}
                        </Text>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <Text variant="caption" tone="subtle">
          This app is single-user and self-hosted: you own the server and the data. Set{" "}
          <code>MYOS_DATA_ENCRYPTION_KEY</code> in production and back it up separately from the
          database, or encrypted content can&rsquo;t be recovered.
        </Text>
      </div>
    </PageContainer>
  );
}

function TierCard({
  tone,
  title,
  body,
}: {
  tone: "success" | "muted";
  title: string;
  body: string;
}) {
  return (
    <div className="border-border bg-elevated flex flex-col gap-1 rounded-lg border p-3">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${tone === "success" ? "bg-success" : "bg-fg-subtle"}`}
          aria-hidden
        />
        <Text variant="body-s" className="font-medium">
          {title}
        </Text>
      </div>
      <Text variant="caption" tone="subtle">
        {body}
      </Text>
    </div>
  );
}
