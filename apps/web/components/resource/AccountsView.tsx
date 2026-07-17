"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Input, Text } from "@myos/ui";
import type { InvestmentAccount } from "@myos/core/resource";
import { InvestmentIcon } from "./resource-icons";

/**
 * AccountsView (Sprint 4.3). Broker/fund-house accounts. An account may link to a Finance
 * (2.11) account by id — the link is a reference, never a copy of Finance's data.
 */
export function AccountsView({
  accounts,
  onCreate,
}: {
  accounts: InvestmentAccount[];
  onCreate: (input: { name: string; institution?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      ...(institution.trim() ? { institution: institution.trim() } : {}),
    });
    setName("");
    setInstitution("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Account name"
          placeholder="Account name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-48"
        />
        <Input
          aria-label="Institution"
          placeholder="Institution…"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="max-w-48"
        />
        <Button size="sm" onClick={submit} disabled={!name.trim()}>
          Add account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={InvestmentIcon}
          title="No accounts yet"
          description="Add the broker or fund house that holds your positions."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">{a.name}</Text>
                {a.institution ? (
                  <Text variant="caption" tone="subtle">
                    {a.institution}
                  </Text>
                ) : null}
              </span>
              {a.financeAccountId ? (
                <Badge size="sm" variant="neutral">
                  Linked to Finance
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
