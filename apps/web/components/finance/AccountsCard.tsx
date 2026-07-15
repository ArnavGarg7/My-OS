"use client";

import { cn, Text } from "@myos/ui";
import type { Account } from "@myos/core/finance";
import { ACCOUNT_ICON, ACCOUNT_LABEL, formatMoney } from "./finance-icons";

/**
 * AccountsCard (Sprint 2.11). Lists accounts with their derived balances;
 * selecting one drives the context panel.
 */
export function AccountsCard({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: (Account & { balance: number })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (accounts.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No accounts yet — add one to start tracking balances.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {accounts.map((account) => {
        const Icon = ACCOUNT_ICON[account.type];
        return (
          <button
            key={account.id}
            type="button"
            onClick={() => onSelect(account.id)}
            aria-pressed={account.id === selectedId}
            className={cn(
              "border-border hover:border-accent/60 flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              account.id === selectedId && "border-accent ring-accent/30 ring-1",
            )}
          >
            <Icon size={18} aria-hidden className="text-fg-subtle shrink-0" />
            <div className="min-w-0 flex-1">
              <Text variant="body-s" className="truncate font-medium">
                {account.name}
              </Text>
              <Text variant="caption" tone="subtle">
                {ACCOUNT_LABEL[account.type]}
              </Text>
            </div>
            <Text variant="body-s" className="font-medium tabular-nums">
              {formatMoney(account.balance)}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
