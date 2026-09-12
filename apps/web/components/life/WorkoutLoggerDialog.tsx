"use client";

import { useState } from "react";
import { ArrowLeft, Dumbbell, HeartPulse, Plus, Trash2 } from "lucide-react";
import {
  Badge,
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
import {
  CARDIO_EXERCISES,
  MUSCLE_GROUPS,
  STRENGTH_BY_GROUP,
  type CatalogExercise,
} from "@myos/core/life";
import { trpc } from "@/lib/trpc/client";

interface SetDraft {
  reps: string;
  weight: string;
  durationMinutes: string;
  intensity: string;
}
interface EntryDraft {
  name: string;
  type: "cardio" | "strength";
  muscleGroup?: string;
  sets: SetDraft[];
}

const emptyStrengthSet = (): SetDraft => ({
  reps: "10",
  weight: "",
  durationMinutes: "",
  intensity: "",
});
const emptyCardioSet = (): SetDraft => ({
  reps: "",
  weight: "",
  durationMinutes: "20",
  intensity: "6",
});

type View = "category" | "cardio" | "groups" | "exercises";

/**
 * Guided workout logger. Pick a category (Cardio / Strength) → for strength, a muscle group → a popular
 * exercise from the built-in catalog; each pick stacks into the session with editable sets (reps×weight,
 * or duration for cardio). Saving persists one session and auto-adds the exercises to your library.
 */
export function WorkoutLoggerDialog() {
  const utils = trpc.useUtils();
  const log = trpc.life.logGuidedWorkout.useMutation({
    onSuccess: () => {
      void utils.life.invalidate();
      setOpen(false);
      setEntries([]);
      setView("category");
    },
  });

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("category");
  const [group, setGroup] = useState<string>("");
  const [entries, setEntries] = useState<EntryDraft[]>([]);
  const [rpe, setRpe] = useState("7");
  const [notes, setNotes] = useState("");

  const addExercise = (c: CatalogExercise) => {
    setEntries((prev) =>
      prev.some((e) => e.name === c.name)
        ? prev
        : [
            ...prev,
            {
              name: c.name,
              type: c.type,
              ...(c.muscleGroup ? { muscleGroup: c.muscleGroup } : {}),
              sets: [c.type === "cardio" ? emptyCardioSet() : emptyStrengthSet()],
            },
          ],
    );
  };

  const patchSet = (ei: number, si: number, patch: Partial<SetDraft>) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    );
  const addSet = (ei: number) =>
    setEntries((prev) =>
      prev.map((e, i) => (i === ei ? { ...e, sets: [...e.sets, emptyStrengthSet()] } : e)),
    );
  const removeEntry = (ei: number) => setEntries((prev) => prev.filter((_, i) => i !== ei));

  const save = () => {
    if (entries.length === 0) return;
    log.mutate({
      entries: entries.map((e) => ({
        name: e.name,
        type: e.type,
        muscleGroups: e.muscleGroup ? [e.muscleGroup] : [],
        sets: e.sets.map((s) => ({
          ...(s.reps ? { reps: Number(s.reps) } : {}),
          ...(s.weight ? { weight: Number(s.weight) } : {}),
          ...(s.durationMinutes ? { durationMinutes: Number(s.durationMinutes) } : {}),
          ...(s.intensity ? { intensity: Number(s.intensity) } : {}),
        })),
      })),
      perceivedExertion: Number(rpe) || 7,
      recoveryNotes: notes.trim(),
    });
  };

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);

  return (
    <>
      <Button leftIcon={<Plus size={15} />} onClick={() => setOpen(true)}>
        Log a workout
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Log a workout</DialogTitle>
            <DialogDescription>
              Pick your exercises — they stack into one session and build your library.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            {/* Picker */}
            <div className="space-y-2">
              {view === "category" ? (
                <div className="grid grid-cols-2 gap-2">
                  <PickerTile icon={HeartPulse} label="Cardio" onClick={() => setView("cardio")} />
                  <PickerTile icon={Dumbbell} label="Strength" onClick={() => setView("groups")} />
                </div>
              ) : null}

              {view === "cardio" ? (
                <PickerList
                  title="Cardio"
                  onBack={() => setView("category")}
                  items={CARDIO_EXERCISES.map((c) => c.name)}
                  onPick={(name) => addExercise(CARDIO_EXERCISES.find((c) => c.name === name)!)}
                />
              ) : null}

              {view === "groups" ? (
                <div className="space-y-1.5">
                  <PickerHeader title="Muscle group" onBack={() => setView("category")} />
                  <div className="grid grid-cols-2 gap-1.5">
                    {MUSCLE_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGroup(g);
                          setView("exercises");
                        }}
                        className="border-border hover:border-accent hover:bg-elevated text-body-s rounded-md border px-2.5 py-2 text-left"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {view === "exercises" ? (
                <PickerList
                  title={group}
                  onBack={() => setView("groups")}
                  items={(STRENGTH_BY_GROUP[group] ?? []).map((c) => c.name)}
                  onPick={(name) =>
                    addExercise((STRENGTH_BY_GROUP[group] ?? []).find((c) => c.name === name)!)
                  }
                />
              ) : null}
            </div>

            {/* Session */}
            <div className="space-y-2">
              <MonoLabel tone="subtle">
                This session{totalSets > 0 ? ` · ${totalSets} sets` : ""}
              </MonoLabel>
              {entries.length === 0 ? (
                <Text variant="body-s" tone="subtle">
                  Nothing added yet — pick exercises on the left.
                </Text>
              ) : (
                <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                  {entries.map((e, ei) => (
                    <div key={e.name} className="border-border bg-surface rounded-md border p-2.5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Text variant="body-s" className="flex-1 font-medium">
                          {e.name}
                        </Text>
                        {e.muscleGroup ? (
                          <Badge variant="outline" size="sm">
                            {e.muscleGroup}
                          </Badge>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`Remove ${e.name}`}
                          onClick={() => removeEntry(ei)}
                          className="text-fg-subtle hover:text-danger"
                        >
                          <Trash2 size={13} aria-hidden />
                        </button>
                      </div>
                      {e.type === "cardio" ? (
                        <div className="flex items-end gap-2">
                          <MiniField label="Minutes">
                            <Input
                              type="number"
                              value={e.sets[0]?.durationMinutes ?? ""}
                              onChange={(ev) =>
                                patchSet(ei, 0, { durationMinutes: ev.target.value })
                              }
                            />
                          </MiniField>
                          <MiniField label="Intensity 1–10">
                            <Input
                              type="number"
                              value={e.sets[0]?.intensity ?? ""}
                              onChange={(ev) => patchSet(ei, 0, { intensity: ev.target.value })}
                            />
                          </MiniField>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {e.sets.map((s, si) => (
                            <div key={si} className="flex items-end gap-2">
                              <Text variant="caption" tone="subtle" className="w-8">
                                #{si + 1}
                              </Text>
                              <MiniField label="Reps">
                                <Input
                                  type="number"
                                  value={s.reps}
                                  onChange={(ev) => patchSet(ei, si, { reps: ev.target.value })}
                                />
                              </MiniField>
                              <MiniField label="Kg">
                                <Input
                                  type="number"
                                  value={s.weight}
                                  onChange={(ev) => patchSet(ei, si, { weight: ev.target.value })}
                                />
                              </MiniField>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addSet(ei)}
                            className="text-accent hover:text-accent/80 text-caption"
                          >
                            + Add set
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-border flex flex-wrap items-end gap-3 border-t pt-3">
            <MiniField label="Session RPE 1–10">
              <Input
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="w-24"
              />
            </MiniField>
            <MiniField label="Recovery notes" className="min-w-[10rem] flex-1">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel?"
              />
            </MiniField>
            <Button onClick={save} loading={log.isPending} disabled={entries.length === 0}>
              Save workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PickerTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Dumbbell;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:border-accent hover:bg-elevated flex flex-col items-center gap-2 rounded-lg border p-4"
    >
      <Icon size={22} aria-hidden className="text-accent" />
      <Text variant="body-s" className="font-medium">
        {label}
      </Text>
    </button>
  );
}

function PickerHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="text-fg-muted hover:text-fg flex items-center gap-1.5"
    >
      <ArrowLeft size={13} aria-hidden />
      <MonoLabel tone="subtle">{title}</MonoLabel>
    </button>
  );
}

function PickerList({
  title,
  items,
  onPick,
  onBack,
}: {
  title: string;
  items: string[];
  onPick: (name: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <PickerHeader title={title} onBack={onBack} />
      <div className="grid gap-1.5">
        {items.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onPick(name)}
            className="border-border hover:border-accent hover:bg-elevated text-body-s flex items-center justify-between rounded-md border px-2.5 py-2 text-left"
          >
            {name}
            <Plus size={13} aria-hidden className="text-fg-subtle" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-fg-subtle text-caption">{label}</span>
      {children}
    </label>
  );
}
