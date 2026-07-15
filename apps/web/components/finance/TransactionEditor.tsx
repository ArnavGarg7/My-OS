"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@myos/ui";
import {
  TRANSACTION_DIRECTIONS,
  type CreateTransactionInputSchema,
  type TransactionDirection,
} from "@myos/core/finance";

/**
 * TransactionEditor (Sprint 2.11). Structured entry form — amount, direction,
 * category, merchant — for a chosen account.
 */
export function TransactionEditor({
  accountId,
  onSave,
  onCancel,
}: {
  accountId: string;
  onSave: (input: CreateTransactionInputSchema) => void;
  onCancel?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<TransactionDirection>("expense");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");

  const save = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    onSave({
      accountId,
      amount: value,
      direction,
      category: category.trim() || (direction === "income" ? "income" : "other"),
      merchant: merchant.trim(),
      description: "",
      projectId: null,
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        aria-label="Amount"
        autoFocus
      />
      <Select value={direction} onValueChange={(v) => v && setDirection(v as TransactionDirection)}>
        <SelectTrigger aria-label="Direction">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRANSACTION_DIRECTIONS.map((d) => (
            <SelectItem key={d} value={d} className="capitalize">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        aria-label="Category"
      />
      <Input
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="Merchant (optional)"
        aria-label="Merchant"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={!amount || Number(amount) <= 0} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
