"use client";

import { useState } from "react";
import { AlertCircle, Mic, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Field,
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
import { scalePer100g } from "@myos/core/nutrition";
import type { RouterOutputs } from "@/lib/trpc/client";
import { useVoice } from "@/lib/interaction/use-voice";
import { useNutrition, mealForNow } from "./use-nutrition";

type ResolveResult = RouterOutputs["nutrition"]["resolveMeal"];
type ResolvedItem = ResolveResult["items"][number];
type Meal = "breakfast" | "lunch" | "dinner" | "snack";
const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

interface Pick {
  candidateIdx: number;
  grams: number;
}

function defaultGrams(item: ResolvedItem): number {
  return item.suggestedGrams ?? item.candidates[0]?.servingGrams ?? 100;
}

/**
 * Log food by typing or voice. The utterance is parsed and each food resolved against the food DB; the
 * user reviews the matched item + confirms the portion (grams) before it's logged. The database owns the
 * macros — this never invents them, and offers manual search when a food can't be resolved.
 */
export function FoodLogger({ date }: { date: string }) {
  const n = useNutrition();
  const [text, setText] = useState("");
  const [meal, setMeal] = useState<Meal>(mealForNow());
  const [planned, setPlanned] = useState(false);
  const [items, setItems] = useState<ResolvedItem[] | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);

  const voice = useVoice((t) => setText((prev) => (prev ? `${prev}, ${t}` : t)));

  const resolve = () => {
    if (!text.trim()) return;
    n.resolveMeal.mutate(
      { text: text.trim(), meal },
      {
        onSuccess: (res) => {
          setItems(res.items);
          setPicks(res.items.map((it) => ({ candidateIdx: 0, grams: defaultGrams(it) })));
        },
      },
    );
  };

  const reset = () => {
    setItems(null);
    setPicks([]);
    setText("");
  };

  const logAll = async () => {
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const cand = items[i]!.candidates[picks[i]!.candidateIdx];
      if (!cand) continue;
      const grams = picks[i]!.grams;
      const m = scalePer100g(cand.per100g, grams);
      await n.logFood.mutateAsync({
        meal,
        name: cand.name,
        brand: cand.brand,
        quantity: grams,
        unit: "g",
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        source: cand.source,
        sourceRef: cand.sourceRef,
        planned,
        consumedOn: date,
      });
    }
    reset();
  };

  const setPick = (i: number, patch: Partial<Pick>) =>
    setPicks((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const resolvable = items?.some((it) => it.candidates.length > 0) ?? false;

  return (
    <Card variant="section" padding="md" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={15} aria-hidden className="text-accent" />
        <MonoLabel tone="subtle">Log food</MonoLabel>
      </div>

      {/* Utterance input + voice + meal + planned */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="flex gap-1.5">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 2 eggs and a bowl of rice"
              onKeyDown={(e) => {
                if (e.key === "Enter") resolve();
              }}
            />
            {voice.supported ? (
              <Button
                type="button"
                variant={voice.state === "listening" ? "primary" : "secondary"}
                aria-label={voice.state === "listening" ? "Stop" : "Speak"}
                onClick={() => (voice.state === "listening" ? voice.stop() : voice.start())}
              >
                <Mic size={15} className={voice.state === "listening" ? "animate-pulse" : ""} />
              </Button>
            ) : null}
          </div>
        </div>
        <Select value={meal} onValueChange={(v) => setMeal(v as Meal)}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEALS.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={resolve} loading={n.resolveMeal.isPending} disabled={!text.trim()}>
          Resolve
        </Button>
      </div>

      <label className="text-body-s flex w-fit items-center gap-2">
        <input type="checkbox" checked={planned} onChange={(e) => setPlanned(e.target.checked)} />
        <Text variant="body-s" tone="muted">
          Planned meal (not eaten yet)
        </Text>
      </label>

      {/* Review resolved items */}
      {items ? (
        <div className="border-border space-y-2 border-t pt-3">
          {items.map((it, i) => {
            const cand = it.candidates[picks[i]?.candidateIdx ?? 0];
            const grams = picks[i]?.grams ?? 100;
            const m = cand ? scalePer100g(cand.per100g, grams) : null;
            return (
              <div
                key={`${it.query}-${i}`}
                className="border-border bg-surface rounded-md border p-2.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <Text variant="body-s" className="font-medium capitalize">
                    {it.query}
                  </Text>
                  {it.quantity ? (
                    <Badge variant="outline" size="sm">
                      {it.quantity}
                      {it.unit ? ` ${it.unit}` : ""}
                    </Badge>
                  ) : null}
                </div>

                {it.candidates.length === 0 ? (
                  <div className="text-warning flex items-center gap-1.5">
                    <AlertCircle size={13} aria-hidden />
                    <Text variant="caption" className="text-warning">
                      {it.error ?? "No match found — search manually below or skip."}
                    </Text>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Field label="Match" className="flex-1">
                      <Select
                        value={String(picks[i]?.candidateIdx ?? 0)}
                        onValueChange={(v) => setPick(i, { candidateIdx: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {it.candidates.map((c, ci) => (
                            <SelectItem key={c.sourceRef} value={String(ci)}>
                              {c.name}
                              {c.brand ? ` · ${c.brand}` : ""} ({c.per100g.calories} kcal/100g)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Grams">
                      <Input
                        type="number"
                        min="1"
                        className="sm:w-24"
                        value={grams}
                        onChange={(e) => setPick(i, { grams: Math.max(1, Number(e.target.value)) })}
                      />
                    </Field>
                  </div>
                )}

                {m ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <MacroChip label="kcal" value={m.calories} />
                    <MacroChip label="P" value={m.protein} unit="g" />
                    <MacroChip label="C" value={m.carbs} unit="g" />
                    <MacroChip label="F" value={m.fat} unit="g" />
                    {cand?.estimated ? (
                      <Badge variant="outline" size="sm" className="text-warning">
                        estimated
                      </Badge>
                    ) : cand?.source === "off" ? (
                      <Badge variant="outline" size="sm">
                        Open Food Facts
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void logAll()}
              loading={n.logFood.isPending}
              disabled={!resolvable}
            >
              Log {planned ? "as planned" : "to diary"}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function MacroChip({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <span className={cn("text-caption tabular-nums")}>
      <span className="text-fg-subtle">{label} </span>
      <span className="text-fg font-medium">
        {value}
        {unit ?? ""}
      </span>
    </span>
  );
}
