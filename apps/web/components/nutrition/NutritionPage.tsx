"use client";

import { useState } from "react";
import { Droplet, Plus, Scale, Settings2, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, MonoLabel, Text, cn } from "@myos/ui";
import { PageContainer, PageContent } from "@/components/framework";
import { useNutrition } from "./use-nutrition";
import { FoodLogger } from "./FoodLogger";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

function MacroBar({
  label,
  value,
  target,
  unit,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  tone: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = value > target && target > 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <MonoLabel tone="subtle">{label}</MonoLabel>
        <Text variant="caption" tone="muted" className="tabular-nums">
          {Math.round(value)}
          <span className="text-fg-subtle">
            {" "}
            / {Math.round(target)}
            {unit}
          </span>
        </Text>
      </div>
      <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-[width]", over && "opacity-90")}
          style={{ width: `${Math.max(2, pct)}%`, background: tone }}
        />
      </div>
    </div>
  );
}

export function NutritionPage() {
  const n = useNutrition();
  const d = n.day.data;
  const [showGoals, setShowGoals] = useState(false);
  const [weight, setWeight] = useState("");

  return (
    <PageContainer width="content">
      <PageContent className="mx-auto w-full max-w-3xl space-y-6 py-2">
        <header className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <MonoLabel tone="subtle">Nutrition</MonoLabel>
            <Text asChild variant="heading-l" className="tracking-tight">
              <h1>Today&apos;s food</h1>
            </Text>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Settings2 size={14} />}
            onClick={() => setShowGoals((v) => !v)}
          >
            Goals
          </Button>
        </header>

        {/* Day dashboard */}
        {d ? (
          <Card variant="elevated" padding="md" className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <MacroBar
                label="Calories"
                value={d.consumed.calories}
                target={d.goals.calorieTarget}
                unit=""
                tone="var(--accent)"
              />
              <MacroBar
                label="Protein"
                value={d.consumed.protein}
                target={d.goals.proteinTarget}
                unit="g"
                tone="#3fb27f"
              />
              <MacroBar
                label="Carbs"
                value={d.consumed.carbs}
                target={d.goals.carbsTarget}
                unit="g"
                tone="#d9a441"
              />
              <MacroBar
                label="Fat"
                value={d.consumed.fat}
                target={d.goals.fatTarget}
                unit="g"
                tone="#c0507a"
              />
            </div>

            <div className="border-border flex flex-wrap items-center gap-4 border-t pt-3">
              <div className="flex items-center gap-2">
                <Droplet size={15} aria-hidden className="text-[#3f93b8]" />
                <Text variant="body-s" className="tabular-nums">
                  {d.waterMl}
                  <span className="text-fg-subtle"> / {d.waterTarget} ml</span>
                </Text>
                {[250, 500].map((ml) => (
                  <Button
                    key={ml}
                    size="sm"
                    variant="secondary"
                    onClick={() => n.logWater.mutate({ amountMl: ml, date: n.date })}
                  >
                    +{ml}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Scale size={15} aria-hidden className="text-fg-subtle" />
                {d.weight ? (
                  <Text variant="body-s" className="tabular-nums">
                    {d.weight} kg
                  </Text>
                ) : null}
                <Input
                  type="number"
                  step="0.1"
                  className="w-20"
                  placeholder="kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!weight}
                  onClick={() => {
                    n.logWeight.mutate({ weight: Number(weight), recordedOn: n.date });
                    setWeight("");
                  }}
                >
                  Log
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" padding="lg">
            <Text variant="body-s" tone="subtle">
              Loading today…
            </Text>
          </Card>
        )}

        {showGoals && d ? (
          <GoalsEditor
            day={d}
            onSave={(g) => n.setGoals.mutate(g)}
            pending={n.setGoals.isPending}
          />
        ) : null}

        <FoodLogger date={n.date} />

        {/* Diary */}
        {d ? <Diary day={d} onRemove={(id) => n.removeFood.mutate({ id })} /> : null}
      </PageContent>
    </PageContainer>
  );
}

function Diary({
  day,
  onRemove,
}: {
  day: NonNullable<ReturnType<typeof useNutrition>["day"]["data"]>;
  onRemove: (id: string) => void;
}) {
  const actual = day.logs.filter((l) => !l.planned);
  const planned = day.logs.filter((l) => l.planned);

  const Row = ({ l }: { l: (typeof day.logs)[number] }) => (
    <div className="border-border bg-surface flex items-center gap-3 rounded-md border px-3 py-2">
      <div className="min-w-0 flex-1">
        <Text variant="body-s" className="font-medium">
          {l.name || "Food"}
          {l.quantity ? (
            <span className="text-fg-subtle">
              {" "}
              · {Math.round(l.quantity)}
              {l.unit || "g"}
            </span>
          ) : null}
        </Text>
        <Text variant="caption" tone="subtle" className="capitalize tabular-nums">
          {l.meal} · {l.calories} kcal · P{l.protein} C{l.carbs} F{l.fat}
        </Text>
      </div>
      <button
        type="button"
        aria-label="Remove"
        onClick={() => onRemove(l.id)}
        className="text-fg-subtle hover:text-danger"
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  );

  const section = (title: string, rows: typeof day.logs) =>
    rows.length > 0 ? (
      <div className="space-y-1.5">
        <MonoLabel tone="subtle">{title}</MonoLabel>
        {[...rows]
          .sort((a, b) => MEAL_ORDER.indexOf(a.meal) - MEAL_ORDER.indexOf(b.meal))
          .map((l) => (
            <Row key={l.id} l={l} />
          ))}
      </div>
    ) : null;

  if (day.logs.length === 0) {
    return (
      <Card variant="section" padding="lg">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Plus size={20} aria-hidden className="text-fg-subtle" />
          <Text variant="body-s" tone="subtle">
            Nothing logged yet. Say or type what you ate above.
          </Text>
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {section("Eaten", actual)}
      {section("Planned", planned)}
    </div>
  );
}

function GoalsEditor({
  day,
  onSave,
  pending,
}: {
  day: NonNullable<ReturnType<typeof useNutrition>["day"]["data"]>;
  onSave: (g: {
    calorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    waterMlTarget: number;
  }) => void;
  pending: boolean;
}) {
  const [c, setC] = useState(String(day.goals.calorieTarget));
  const [p, setP] = useState(String(day.goals.proteinTarget));
  const [cb, setCb] = useState(String(day.goals.carbsTarget));
  const [f, setF] = useState(String(day.goals.fatTarget));
  const [w, setW] = useState(String(day.waterTarget));

  return (
    <Card variant="section" padding="md" className="space-y-3">
      <MonoLabel tone="subtle">Daily targets</MonoLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field label="Calories">
          <Input type="number" value={c} onChange={(e) => setC(e.target.value)} />
        </Field>
        <Field label="Protein g">
          <Input type="number" value={p} onChange={(e) => setP(e.target.value)} />
        </Field>
        <Field label="Carbs g">
          <Input type="number" value={cb} onChange={(e) => setCb(e.target.value)} />
        </Field>
        <Field label="Fat g">
          <Input type="number" value={f} onChange={(e) => setF(e.target.value)} />
        </Field>
        <Field label="Water ml">
          <Input type="number" value={w} onChange={(e) => setW(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          loading={pending}
          onClick={() =>
            onSave({
              calorieTarget: Number(c),
              proteinTarget: Number(p),
              carbsTarget: Number(cb),
              fatTarget: Number(f),
              waterMlTarget: Number(w),
            })
          }
        >
          Save targets
        </Button>
      </div>
    </Card>
  );
}
