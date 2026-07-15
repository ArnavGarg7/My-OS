"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";
import { parseTransaction, type CreateTransactionInputSchema } from "@myos/core/finance";

/**
 * QuickTransaction (Sprint 2.11). One-line capture parsed deterministically into
 * amount + direction + category + merchant. "Spent 450 on groceries".
 */
export function QuickTransaction({
  accountId,
  onAdd,
}: {
  accountId: string | null;
  onAdd: (input: CreateTransactionInputSchema) => void;
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim() || !accountId) return;
    const parsed = parseTransaction(text);
    if (parsed.amount <= 0) return;
    onAdd({
      accountId,
      amount: parsed.amount,
      direction: parsed.direction,
      category: parsed.category,
      merchant: parsed.merchant,
      description: text.trim(),
      projectId: null,
    });
    setText("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Spent 450 on groceries…"
          aria-label="Quick transaction"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={!accountId}
        />
        <Button disabled={!text.trim() || !accountId} onClick={submit}>
          <Plus size={14} aria-hidden />
          Add
        </Button>
      </div>
      {!accountId && (
        <Text variant="caption" tone="subtle">
          Select an account to log transactions.
        </Text>
      )}
    </div>
  );
}
