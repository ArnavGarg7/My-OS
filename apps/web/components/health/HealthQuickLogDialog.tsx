"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Apple, Dumbbell, HeartPulse, Plus } from "lucide-react";
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
import {
  ENERGY_LEVELS,
  HYDRATION_PRESETS,
  MOODS,
  SLEEP_DURATIONS_HOURS,
  WORKOUT_DURATIONS_MIN,
  type Mood,
} from "@myos/core/health";
import {
  CARDIO_EXERCISES,
  MUSCLE_GROUPS,
  STRENGTH_BY_GROUP,
  type CatalogExercise,
} from "@myos/core/life";
import { HEALTH_ICONS, ENERGY_LABEL } from "./health-icons";
import type { useHealthController } from "./use-health";

type Controller = ReturnType<typeof useHealthController>;

const METRICS = [
  { id: "water", label: "Water", icon: HEALTH_ICONS.water },
  { id: "workout", label: "Workout", icon: HEALTH_ICONS.workout },
  { id: "sleep", label: "Sleep", icon: HEALTH_ICONS.sleep },
  { id: "weight", label: "Body weight", icon: HEALTH_ICONS.body },
  { id: "energy", label: "Energy", icon: HEALTH_ICONS.energy },
  { id: "mood", label: "Mood", icon: HEALTH_ICONS.heart },
  { id: "meal", label: "Meal", icon: Apple },
] as const;
type Metric = (typeof METRICS)[number]["id"];

const MOOD_LABEL: Record<Mood, string> = {
  poor: "Poor",
  okay: "Okay",
  good: "Good",
  great: "Great",
};

/** Derive ISO bed/wake timestamps for a sleep of `hours`, ending now. */
function sleepWindow(hours: number): { bedTime: string; wakeTime: string } {
  const wake = new Date();
  const bed = new Date(wake.getTime() - hours * 60 * 60_000);
  return { bedTime: bed.toISOString(), wakeTime: wake.toISOString() };
}

/**
 * Guided health quick-log. Pick a metric → tap a common preset (or set a number) → it logs in one or two
 * taps, no typing or parser guessing. Meals route to the Nutrition module, which is the source of truth
 * for calories. Mirrors the guided workout / goal / nutrition flows. The free-text quick-log stays as a
 * secondary "or type it" fallback on the page.
 */
export function HealthQuickLogDialog({ controller }: { controller: Controller }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<Metric | null>(null);
  const [weight, setWeight] = useState("");

  const close = () => {
    setOpen(false);
    setMetric(null);
    setWeight("");
  };

  const done = () => close();

  return (
    <>
      <Button leftIcon={<Plus size={15} />} onClick={() => setOpen(true)}>
        Quick log
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
            <DialogTitle>Quick log</DialogTitle>
            <DialogDescription>
              {metric === null
                ? "What do you want to log?"
                : "Tap a common value — it logs straight away."}
            </DialogDescription>
          </DialogHeader>

          {metric === null ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetric(m.id)}
                  className="border-border hover:border-accent hover:bg-elevated flex flex-col items-center gap-2 rounded-lg border p-4"
                >
                  <m.icon size={20} aria-hidden className="text-accent" />
                  <Text variant="body-s" className="font-medium">
                    {m.label}
                  </Text>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <BackHeader
                label={METRICS.find((m) => m.id === metric)!.label}
                onBack={() => setMetric(null)}
              />

              {metric === "water" ? (
                <div className="space-y-3">
                  {HYDRATION_PRESETS.map((group) => (
                    <div key={group.source} className="space-y-1.5">
                      <MonoLabel tone="subtle">{group.label}</MonoLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {group.amounts.map((a) => (
                          <Chip
                            key={a.label}
                            label={a.label}
                            onClick={() => {
                              controller.logWater(a.ml, group.source);
                              done();
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {metric === "workout" ? (
                <WorkoutPicker
                  onLog={(type, minutes, note) => {
                    controller.logWorkout(type, minutes, null, note);
                    done();
                  }}
                />
              ) : null}

              {metric === "sleep" ? (
                <div className="flex flex-wrap gap-1.5">
                  {SLEEP_DURATIONS_HOURS.map((h) => (
                    <Chip
                      key={h}
                      label={`${h}h`}
                      onClick={() => {
                        const { bedTime, wakeTime } = sleepWindow(h);
                        controller.logSleep(bedTime, wakeTime);
                        done();
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {metric === "weight" ? (
                <div className="flex items-end gap-2">
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-fg-subtle text-caption">Your body weight (kg)</span>
                    <Input
                      autoFocus
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 72.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && Number(weight) > 0) {
                          controller.updateWeight(Number(weight));
                          done();
                        }
                      }}
                    />
                  </label>
                  <Button
                    disabled={!(Number(weight) > 0)}
                    onClick={() => {
                      controller.updateWeight(Number(weight));
                      done();
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : null}

              {metric === "energy" ? (
                <div className="flex flex-wrap gap-1.5">
                  {ENERGY_LEVELS.map((level) => (
                    <Chip
                      key={level}
                      label={ENERGY_LABEL[level]}
                      onClick={() => {
                        controller.setEnergy(level);
                        done();
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {metric === "mood" ? (
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((mood) => (
                    <Chip
                      key={mood}
                      label={MOOD_LABEL[mood]}
                      onClick={() => {
                        controller.setMood(mood);
                        done();
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {metric === "meal" ? (
                <div className="space-y-2">
                  <Text variant="body-s" tone="subtle">
                    Meals are logged in Nutrition, which resolves real calories and macros from the
                    food database rather than guessing.
                  </Text>
                  <Button
                    variant="secondary"
                    leftIcon={<Apple size={15} />}
                    onClick={() => {
                      close();
                      router.push("/nutrition");
                    }}
                  >
                    Open Nutrition
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Guided workout picker. Cardio → a common cardio exercise; Strength → a muscle group → a popular
 * exercise for it — the same real catalog the Life workout logger uses. After picking the exercise, tap
 * a duration and it logs a health workout (type + minutes) tagged with the exercise, so it shows on the
 * timeline and feeds readiness.
 */
function WorkoutPicker({
  onLog,
}: {
  onLog: (type: "cardio" | "strength", minutes: number, note: string) => void;
}) {
  const [category, setCategory] = useState<"cardio" | "strength" | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [exercise, setExercise] = useState<CatalogExercise | null>(null);

  // Step 1 — category
  if (category === null) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setCategory("cardio")}
          className="border-border hover:border-accent hover:bg-elevated flex flex-col items-center gap-1 rounded-lg border p-4"
        >
          <HeartPulse size={20} aria-hidden className="text-accent" />
          <Text variant="body-s" className="font-medium">
            Cardio
          </Text>
        </button>
        <button
          type="button"
          onClick={() => setCategory("strength")}
          className="border-border hover:border-accent hover:bg-elevated flex flex-col items-center gap-1 rounded-lg border p-4"
        >
          <Dumbbell size={20} aria-hidden className="text-accent" />
          <Text variant="body-s" className="font-medium">
            Strength
          </Text>
        </button>
      </div>
    );
  }

  // Step 4 — duration (once an exercise is chosen)
  if (exercise) {
    const note =
      category === "strength" && exercise.muscleGroup
        ? `${exercise.name} · ${exercise.muscleGroup}`
        : exercise.name;
    return (
      <div className="space-y-2">
        <BackHeader label={exercise.name} onBack={() => setExercise(null)} />
        <MonoLabel tone="subtle">How long?</MonoLabel>
        <div className="flex flex-wrap gap-1.5">
          {WORKOUT_DURATIONS_MIN.map((min) => (
            <Chip key={min} label={`${min} min`} onClick={() => onLog(category, min, note)} />
          ))}
        </div>
      </div>
    );
  }

  // Cardio — pick an exercise directly
  if (category === "cardio") {
    return (
      <div className="space-y-2">
        <BackHeader label="Cardio" onBack={() => setCategory(null)} />
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {CARDIO_EXERCISES.map((c) => (
            <ExerciseTile key={c.name} label={c.name} onClick={() => setExercise(c)} />
          ))}
        </div>
      </div>
    );
  }

  // Strength — pick a muscle group, then an exercise
  if (group === null) {
    return (
      <div className="space-y-2">
        <BackHeader label="Strength — body part" onBack={() => setCategory(null)} />
        <div className="grid grid-cols-3 gap-1.5">
          {MUSCLE_GROUPS.map((g) => (
            <ExerciseTile key={g} label={g} onClick={() => setGroup(g)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <BackHeader label={group} onBack={() => setGroup(null)} />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {(STRENGTH_BY_GROUP[group] ?? []).map((c) => (
          <ExerciseTile key={c.name} label={c.name} onClick={() => setExercise(c)} />
        ))}
      </div>
    </div>
  );
}

function ExerciseTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:border-accent hover:bg-elevated text-body-s rounded-md border px-2.5 py-2 text-left"
    >
      {label}
    </button>
  );
}

function BackHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="text-fg-muted hover:text-fg flex items-center gap-1.5"
    >
      <ArrowLeft size={13} aria-hidden />
      <MonoLabel tone="subtle">{label}</MonoLabel>
    </button>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-border text-body-s rounded-md border px-2.5 py-1.5",
        "hover:border-accent hover:bg-elevated",
      )}
    >
      {label}
    </button>
  );
}
