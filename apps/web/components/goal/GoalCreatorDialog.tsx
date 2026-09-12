"use client";

import { useState } from "react";
import { ArrowLeft, Flag, Plus } from "lucide-react";
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
  Textarea,
  cn,
} from "@myos/ui";
import {
  GOAL_PRIORITIES,
  GOAL_TEMPLATES,
  GOAL_TYPES,
  TARGET_DATE_PRESETS,
  resolveTargetDate,
  type CreateGoalSchemaInput,
  type GoalPriority,
  type GoalTemplate,
  type GoalType,
  type TargetDatePreset,
  type TargetDatePresetId,
} from "@myos/core/goal";
import { GOAL_TYPE_ICON, GOAL_TYPE_LABEL } from "./goal-icons";

const PRIORITY_LABEL: Record<GoalPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

type View = "category" | "templates" | "compose";

/**
 * Guided goal creator. Pick a category (Career / Education / Health / …) → a common goal template from
 * the built-in catalog (or start from scratch) → tweak the title, target date and priority. Seeds a new
 * goal via goal.create so the user starts from a head start rather than a blank form. Mirrors the guided
 * workout / nutrition flows.
 */
export function GoalCreatorDialog({
  onCreate,
}: {
  onCreate: (input: CreateGoalSchemaInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("category");
  const [goalType, setGoalType] = useState<GoalType>("personal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [presetId, setPresetId] = useState<TargetDatePresetId>("none");
  const [customDate, setCustomDate] = useState("");

  const reset = () => {
    setView("category");
    setGoalType("personal");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setPresetId("none");
    setCustomDate("");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const pickTemplate = (t: GoalTemplate) => {
    setTitle(t.title);
    setDescription(t.description ?? "");
    setPriority(t.priority);
    setPresetId(t.suggestedPreset);
    setView("compose");
  };

  const startFromScratch = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setPresetId("none");
    setView("compose");
  };

  const resolvedDate = (): string | null => {
    if (presetId === "custom") return customDate || null;
    const preset = TARGET_DATE_PRESETS.find((p) => p.id === presetId);
    return preset ? resolveTargetDate(preset, todayISO()) : null;
  };

  const create = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      goalType,
      priority,
      ...(description.trim() ? { description: description.trim() } : {}),
      targetDate: resolvedDate(),
    });
    close();
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Flag size={14} aria-hidden />
        New goal
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
            <DialogTitle>New goal</DialogTitle>
            <DialogDescription>
              {view === "category"
                ? "What area of life is this goal about?"
                : view === "templates"
                  ? "Pick a common goal to start from — or build your own."
                  : "Fine-tune the outcome, when you want it, and how much it matters."}
            </DialogDescription>
          </DialogHeader>

          {view === "category" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GOAL_TYPES.map((t) => {
                const Icon = GOAL_TYPE_ICON[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setGoalType(t);
                      setView("templates");
                    }}
                    className="border-border hover:border-accent hover:bg-elevated flex flex-col items-center gap-2 rounded-lg border p-4"
                  >
                    <Icon size={22} aria-hidden className="text-accent" />
                    <Text variant="body-s" className="font-medium">
                      {GOAL_TYPE_LABEL[t]}
                    </Text>
                  </button>
                );
              })}
            </div>
          ) : null}

          {view === "templates" ? (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setView("category")}
                className="text-fg-muted hover:text-fg flex items-center gap-1.5"
              >
                <ArrowLeft size={13} aria-hidden />
                <MonoLabel tone="subtle">{GOAL_TYPE_LABEL[goalType]}</MonoLabel>
              </button>
              <div className="grid gap-1.5">
                {GOAL_TEMPLATES[goalType].map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => pickTemplate(t)}
                    className="border-border hover:border-accent hover:bg-elevated text-body-s flex items-center justify-between rounded-md border px-2.5 py-2 text-left"
                  >
                    {t.title}
                    <Plus size={13} aria-hidden className="text-fg-subtle" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={startFromScratch}
                  className="border-border text-fg-muted hover:border-accent hover:text-fg text-caption mt-1 rounded-md border border-dashed px-2.5 py-2 text-left"
                >
                  Start from scratch
                </button>
              </div>
            </div>
          ) : null}

          {view === "compose" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setView("templates")}
                className="text-fg-muted hover:text-fg flex items-center gap-1.5"
              >
                <ArrowLeft size={13} aria-hidden />
                <MonoLabel tone="subtle">{GOAL_TYPE_LABEL[goalType]}</MonoLabel>
              </button>

              <Field label="Goal">
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What outcome do you want?"
                  aria-label="Goal title"
                />
              </Field>

              <Field label="Details (optional)">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does success look like?"
                  rows={2}
                />
              </Field>

              <Field label="Target date">
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_DATE_PRESETS.map((p) => (
                    <PresetChip
                      key={p.id}
                      preset={p}
                      active={presetId === p.id}
                      onClick={() => setPresetId(p.id)}
                    />
                  ))}
                </div>
                {presetId === "custom" ? (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    aria-label="Custom target date"
                    className="mt-2"
                  />
                ) : null}
              </Field>

              <Field label="Priority">
                <Select value={priority} onValueChange={(v) => v && setPriority(v as GoalPriority)}>
                  <SelectTrigger aria-label="Priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button onClick={create} disabled={!title.trim()}>
                  Create goal
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PresetChip({
  preset,
  active,
  onClick,
}: {
  preset: TargetDatePreset;
  active: boolean;
  onClick: () => void;
}) {
  const resolved =
    preset.kind === "custom" || preset.kind === "none"
      ? null
      : resolveTargetDate(preset, todayISO());
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-border text-body-s rounded-md border px-2.5 py-1.5",
        active ? "border-accent bg-accent/10 text-accent" : "hover:border-accent hover:bg-elevated",
      )}
      title={resolved ?? undefined}
    >
      {preset.label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-fg-subtle text-caption">{label}</span>
      {children}
    </label>
  );
}
