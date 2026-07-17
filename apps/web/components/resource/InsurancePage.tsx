"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import {
  INSURANCE_TYPES,
  annualPremium,
  coverageByType,
  totalCoverage,
  upcomingRenewals,
  type InsurancePolicy,
  type InsuranceType,
} from "@myos/core/resource";
import {
  INSURANCE_TYPE_LABEL,
  InsuranceIcon,
  formatCountdown,
  formatMoney,
} from "./resource-icons";

/**
 * InsurancePage (Sprint 4.3). Policies, coverage and renewal countdowns. The platform
 * records claims as history — it does not adjudicate them, price risk, or advise on cover.
 */
export function InsurancePage({
  policies,
  onCreate,
  onAddClaim,
}: {
  policies: InsurancePolicy[];
  onCreate: (input: {
    name: string;
    type?: InsuranceType;
    provider?: string;
    coverageAmount?: number;
    premium?: number;
    expiresAt: string;
  }) => void;
  onAddClaim: (input: { id: string; claim: string }) => void;
}) {
  const now = new Date();
  const [name, setName] = useState("");
  const [type, setType] = useState<InsuranceType>("health");
  const [provider, setProvider] = useState("");
  const [coverage, setCoverage] = useState("");
  const [premium, setPremium] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const submit = () => {
    if (!name.trim() || !expiresAt) return;
    onCreate({
      name: name.trim(),
      type,
      ...(provider.trim() ? { provider: provider.trim() } : {}),
      coverageAmount: Number(coverage) || 0,
      premium: Number(premium) || 0,
      expiresAt,
    });
    setName("");
    setProvider("");
    setCoverage("");
    setPremium("");
    setExpiresAt("");
  };

  const renewals = upcomingRenewals(policies, now);
  const byType = coverageByType(policies, now);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
        <Text variant="caption" tone="subtle">
          ADD A POLICY
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Policy name"
            placeholder="Policy name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-44"
          />
          <select
            aria-label="Insurance type"
            value={type}
            onChange={(e) => setType(e.target.value as InsuranceType)}
            className="border-border bg-surface text-fg h-9 rounded-md border px-2 text-sm"
          >
            {INSURANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {INSURANCE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <Input
            aria-label="Provider"
            placeholder="Provider…"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="max-w-36"
          />
          <Input
            aria-label="Coverage amount"
            placeholder="Coverage"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            className="max-w-28"
          />
          <Input
            aria-label="Premium"
            placeholder="Premium"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            className="max-w-24"
          />
          <Input
            aria-label="Expiry date"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="max-w-40"
          />
          <Button size="sm" onClick={submit} disabled={!name.trim() || !expiresAt}>
            Add
          </Button>
        </div>
      </div>

      {policies.length === 0 ? (
        <EmptyState
          icon={InsuranceIcon}
          title="No policies yet"
          description="Catalogue your cover so renewals never surprise you."
        />
      ) : (
        <>
          <div className="border-border-subtle flex flex-wrap items-center gap-4 rounded-md border px-3 py-2">
            <div>
              <Text variant="caption" tone="subtle">
                Total cover
              </Text>
              <Text variant="body-m">{formatMoney(totalCoverage(policies, now))}</Text>
            </div>
            <div>
              <Text variant="caption" tone="subtle">
                Annual premium
              </Text>
              <Text variant="body-m">{formatMoney(annualPremium(policies, now))}</Text>
            </div>
            {Object.entries(byType).map(([t, amount]) => (
              <Badge key={t} size="sm" variant="neutral">
                {t}: {formatMoney(amount)}
              </Badge>
            ))}
          </div>

          {renewals.length > 0 ? (
            <div className="flex flex-col gap-1">
              <Text variant="caption" tone="subtle">
                RENEWING SOON
              </Text>
              {renewals.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <Text variant="body-s">{r.name}</Text>
                  <Badge size="sm" variant={r.expired ? "danger" : "warning"}>
                    {formatCountdown(r.daysUntil)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}

          <ul className="flex flex-col gap-1">
            {policies.map((p) => (
              <PolicyRow key={p.id} policy={p} onAddClaim={onAddClaim} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function PolicyRow({
  policy,
  onAddClaim,
}: {
  policy: InsurancePolicy;
  onAddClaim: (input: { id: string; claim: string }) => void;
}) {
  const [claim, setClaim] = useState("");
  return (
    <li className="border-border-subtle flex flex-col gap-2 rounded-md border px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="flex flex-col">
          <Text variant="body-s">{policy.name}</Text>
          <Text variant="caption" tone="subtle">
            {INSURANCE_TYPE_LABEL[policy.type]}
            {policy.provider ? ` · ${policy.provider}` : ""} · {formatMoney(policy.coverageAmount)}{" "}
            cover
          </Text>
        </span>
        {policy.claims.length > 0 ? (
          <Badge size="sm" variant="neutral">
            {policy.claims.length} claim{policy.claims.length === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Record a claim on ${policy.name}`}
          placeholder="Record a claim…"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          className="max-w-64"
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={!claim.trim()}
          onClick={() => {
            onAddClaim({ id: policy.id, claim: claim.trim() });
            setClaim("");
          }}
        >
          Add claim
        </Button>
      </div>
    </li>
  );
}
