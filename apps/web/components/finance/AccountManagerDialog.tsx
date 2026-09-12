"use client";

import { useState } from "react";
import { Archive, Landmark, RotateCcw } from "lucide-react";
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
import { ACCOUNT_TYPES, type AccountType } from "@myos/core/finance";
import { ACCOUNT_ICON, ACCOUNT_LABEL, formatMoney } from "./finance-icons";
import type { useFinance } from "./use-finance";

type Controller = ReturnType<typeof useFinance>;

/**
 * Manage accounts (Phase 3). Create a new account (name / type / opening balance / institution), rename
 * or retype an existing one, and archive accounts no longer in use. Archived accounts keep their history
 * but drop out of the record-entry pickers.
 */
export function AccountManagerDialog({ controller }: { controller: Controller }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [opening, setOpening] = useState("");
  const [institution, setInstitution] = useState("");

  const accounts = controller.accounts;
  const active = accounts.filter((a) => !a.archived);
  const archived = accounts.filter((a) => a.archived);

  const add = () => {
    if (!name.trim()) return;
    controller.createAccount({
      name: name.trim(),
      type,
      openingBalance: Number(opening) || 0,
      institution: institution.trim(),
    });
    setName("");
    setType("checking");
    setOpening("");
    setInstitution("");
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={<Landmark size={14} />}
        onClick={() => setOpen(true)}
      >
        Accounts
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Accounts</DialogTitle>
            <DialogDescription>
              Add the accounts you spend from, and archive ones you no longer use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Add form */}
            <div className="border-border grid grid-cols-2 gap-2 rounded-md border p-3">
              <label className="col-span-2 flex flex-col gap-1">
                <MonoLabel tone="subtle">New account</MonoLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HDFC Savings"
                  onKeyDown={(e) => e.key === "Enter" && add()}
                />
              </label>
              <label className="flex flex-col gap-1">
                <MonoLabel tone="subtle">Type</MonoLabel>
                <Select value={type} onValueChange={(v) => v && setType(v as AccountType)}>
                  <SelectTrigger aria-label="Account type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ACCOUNT_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-1">
                <MonoLabel tone="subtle">Opening balance</MonoLabel>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1">
                <MonoLabel tone="subtle">Institution (optional)</MonoLabel>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Bank / provider"
                />
              </label>
              <div className="col-span-2 flex justify-end">
                <Button size="sm" onClick={add} disabled={!name.trim()}>
                  Add account
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[36vh] space-y-1.5 overflow-y-auto pr-1">
              {active.map((a) => {
                const Icon = ACCOUNT_ICON[a.type];
                return (
                  <Row key={a.id}>
                    <Icon size={16} aria-hidden className="text-fg-muted" />
                    <Input
                      defaultValue={a.name}
                      aria-label={`Rename ${a.name}`}
                      className="h-8 flex-1"
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next && next !== a.name)
                          controller.updateAccount({ id: a.id, name: next });
                      }}
                    />
                    <Text variant="caption" tone="subtle" className="tabular-nums">
                      {formatMoney(a.balance)}
                    </Text>
                    <IconBtn
                      label={`Archive ${a.name}`}
                      onClick={() => controller.updateAccount({ id: a.id, archived: true })}
                    >
                      <Archive size={14} aria-hidden />
                    </IconBtn>
                  </Row>
                );
              })}
              {archived.map((a) => {
                const Icon = ACCOUNT_ICON[a.type];
                return (
                  <Row key={a.id} muted>
                    <Icon size={16} aria-hidden className="text-fg-subtle" />
                    <Text variant="body-s" tone="subtle" className="flex-1 truncate line-through">
                      {a.name}
                    </Text>
                    <IconBtn
                      label={`Restore ${a.name}`}
                      onClick={() => controller.updateAccount({ id: a.id, archived: false })}
                    >
                      <RotateCcw size={14} aria-hidden />
                    </IconBtn>
                  </Row>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      className={cn(
        "border-border flex items-center gap-2.5 rounded-md border px-2.5 py-2",
        muted && "opacity-70",
      )}
    >
      {children}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="text-fg-subtle hover:text-fg"
    >
      {children}
    </button>
  );
}
