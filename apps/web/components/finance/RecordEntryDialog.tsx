"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  MonoLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  cn,
} from "@myos/ui";
import { type CreateTransactionInputSchema, type TransactionDirection } from "@myos/core/finance";
import { categoryIcon, categoryOptions } from "./finance-icons";
import type { useFinance } from "./use-finance";

type Controller = ReturnType<typeof useFinance>;

const TABS: { direction: TransactionDirection; label: string }[] = [
  { direction: "expense", label: "Expense" },
  { direction: "income", label: "Income" },
  { direction: "transfer", label: "Transfer" },
];

/**
 * Guided record entry. Pick Expense / Income / Transfer → type the amount → tap a category (icon grid)
 * → pick the account, and save. Mirrors the guided workout / goal / health flows and gives finance the
 * MyMoney-style tappable capture. The free-text QuickTransaction box stays as an "or type it" fallback.
 */
export function RecordEntryDialog({ controller }: { controller: Controller }) {
  const accounts = useMemo(
    () => controller.accounts.filter((a) => !a.archived),
    [controller.accounts],
  );
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<TransactionDirection>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");

  const defaultAccount = controller.selectedAccountId ?? accounts[0]?.id ?? "";
  const fromAccount = accountId || defaultAccount;

  const categories = useMemo(
    () =>
      categoryOptions(direction === "income" ? "income" : "expense", controller.customCategories),
    [direction, controller.customCategories],
  );

  const reset = () => {
    setDirection("expense");
    setAmount("");
    setCategory("");
    setMerchant("");
    setAccountId("");
    setToAccountId("");
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const amountNum = Number(amount);
  const isTransfer = direction === "transfer";
  const canSave =
    amountNum > 0 &&
    !!fromAccount &&
    (isTransfer ? !!toAccountId && toAccountId !== fromAccount : !!category);

  const save = () => {
    if (!canSave) return;
    if (isTransfer) {
      controller.transfer({ fromAccountId: fromAccount, toAccountId, amount: amountNum });
    } else {
      const input: CreateTransactionInputSchema = {
        accountId: fromAccount,
        amount: amountNum,
        direction,
        category,
        merchant: merchant.trim(),
        description: merchant.trim(),
        projectId: null,
      };
      controller.addTransaction(input);
    }
    close();
  };

  return (
    <>
      <Button leftIcon={<Plus size={15} />} onClick={() => setOpen(true)}>
        Add record
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) close();
          else setOpen(true);
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Add record</DialogTitle>
            <DialogDescription>Log money in, out, or moved between accounts.</DialogDescription>
          </DialogHeader>

          {accounts.length === 0 ? (
            <Text variant="body-s" tone="subtle">
              Add an account first — you need somewhere to record this against.
            </Text>
          ) : (
            <div className="space-y-3">
              {/* Type segmented control */}
              <div className="border-border grid grid-cols-3 gap-1 rounded-md border p-1">
                {TABS.map((t) => (
                  <button
                    key={t.direction}
                    type="button"
                    onClick={() => {
                      setDirection(t.direction);
                      setCategory("");
                    }}
                    className={cn(
                      "text-body-s rounded px-2 py-1.5 font-medium",
                      direction === t.direction
                        ? "bg-accent text-on-accent"
                        : "text-fg-muted hover:bg-elevated",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Field label="Amount">
                <Input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-heading-s font-mono tabular-nums"
                />
              </Field>

              <Field label={isTransfer ? "From account" : "Account"}>
                <Select value={fromAccount} onValueChange={(v) => v && setAccountId(v)}>
                  <SelectTrigger aria-label="Account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {isTransfer ? (
                <Field label="To account">
                  <Select value={toAccountId} onValueChange={(v) => v && setToAccountId(v)}>
                    <SelectTrigger aria-label="To account">
                      <SelectValue placeholder="Choose destination…" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.id !== fromAccount)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <>
                  <Field label="Category">
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                      {categories.map((c) => {
                        const Icon = categoryIcon(c.icon);
                        const active = category === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategory(c.id)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-md border px-1.5 py-2",
                              active
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
                            )}
                          >
                            <Icon size={18} aria-hidden />
                            <span className="text-caption leading-tight">{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Note (optional)">
                    <Input
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      placeholder={direction === "income" ? "Source…" : "Merchant or note…"}
                    />
                  </Field>
                </>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={!canSave}>
                  Save record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <MonoLabel tone="subtle">{label}</MonoLabel>
      {children}
    </label>
  );
}
