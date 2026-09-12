"use client";

import { useState } from "react";
import { Archive, RotateCcw, Tags } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  MonoLabel,
  Text,
  cn,
} from "@myos/ui";
import { CATEGORY_ICON_KEYS, type CategoryGroup } from "@myos/core/finance";
import { categoryIcon } from "./finance-icons";
import type { useFinance } from "./use-finance";

type Controller = ReturnType<typeof useFinance>;

/**
 * Manage custom spending/income categories (Phase 3). Built-in categories are always available; here the
 * user adds their own (label + group + icon), and archives ones they no longer use. Custom categories
 * then appear in the guided record entry and the spending analysis alongside the built-ins.
 */
export function CategoryManagerDialog({ controller }: { controller: Controller }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState<CategoryGroup>("expense");
  const [icon, setIcon] = useState<string>("other");

  const custom = controller.customCategories;
  const active = custom.filter((c) => !c.archived);
  const archived = custom.filter((c) => c.archived);

  const add = () => {
    if (!label.trim()) return;
    controller.createCategory({ label: label.trim(), group, icon, color: "" });
    setLabel("");
    setIcon("other");
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={<Tags size={14} />}
        onClick={() => setOpen(true)}
      >
        Categories
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
            <DialogDescription>
              Add your own categories — they show up in record entry and analysis next to the
              built-in ones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Add form */}
            <div className="border-border space-y-2 rounded-md border p-3">
              <div className="flex items-end gap-2">
                <label className="flex flex-1 flex-col gap-1">
                  <MonoLabel tone="subtle">New category</MonoLabel>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Pet care"
                    onKeyDown={(e) => e.key === "Enter" && add()}
                  />
                </label>
                <div className="border-border flex rounded-md border p-0.5">
                  {(["expense", "income"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGroup(g)}
                      className={cn(
                        "text-caption rounded px-2 py-1 capitalize",
                        group === g
                          ? "bg-accent text-on-accent"
                          : "text-fg-muted hover:bg-elevated",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_ICON_KEYS.map((key) => {
                  const Icon = categoryIcon(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      onClick={() => setIcon(key)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md border",
                        icon === key
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-fg-muted hover:border-accent",
                      )}
                    >
                      <Icon size={15} aria-hidden />
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={add} disabled={!label.trim()}>
                  Add category
                </Button>
              </div>
            </div>

            {/* Custom list */}
            {active.length === 0 && archived.length === 0 ? (
              <Text variant="body-s" tone="subtle">
                No custom categories yet — built-in ones are always available.
              </Text>
            ) : (
              <div className="max-h-[36vh] space-y-1.5 overflow-y-auto pr-1">
                {active.map((c) => {
                  const Icon = categoryIcon(c.icon);
                  return (
                    <Row key={c.id}>
                      <Icon size={15} aria-hidden className="text-fg-muted" />
                      <Text variant="body-s" className="flex-1 truncate">
                        {c.label}
                      </Text>
                      <MonoLabel tone="subtle">{c.group}</MonoLabel>
                      <IconBtn
                        label={`Archive ${c.label}`}
                        onClick={() => controller.archiveCategory(c.id)}
                      >
                        <Archive size={14} aria-hidden />
                      </IconBtn>
                    </Row>
                  );
                })}
                {archived.map((c) => {
                  const Icon = categoryIcon(c.icon);
                  return (
                    <Row key={c.id} muted>
                      <Icon size={15} aria-hidden className="text-fg-subtle" />
                      <Text variant="body-s" tone="subtle" className="flex-1 truncate line-through">
                        {c.label}
                      </Text>
                      <IconBtn
                        label={`Restore ${c.label}`}
                        onClick={() => controller.updateCategory({ id: c.id, archived: false })}
                      >
                        <RotateCcw size={14} aria-hidden />
                      </IconBtn>
                    </Row>
                  );
                })}
              </div>
            )}
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
