"use client";

import { useMemo, useState } from "react";
import { Input, MonoLabel, Text, cn } from "@myos/ui";
import {
  categoryBreakdown,
  incomeVsExpense,
  monthlyTrend,
  resolvePeriod,
  transactionsInRange,
  type AnalysisPeriodId,
  type CustomCategory,
  type Transaction,
} from "@myos/core/finance";
import { categoryIcon, categoryMeta, formatMoney } from "./finance-icons";

const PERIODS: { id: AnalysisPeriodId; label: string }[] = [
  { id: "this-week", label: "This week" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "custom", label: "Custom" },
];

const TREND_MONTHS = 6;
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

/**
 * Spending analysis (Phase 2). A period switcher (this week / month / last month / custom) over a
 * deterministic category breakdown, income-vs-expense summary and a month-over-month trend. Every number
 * is derived by the pure finance engine — no AI, no estimates.
 */
export function SpendingAnalysis({
  transactions,
  customCategories = [],
}: {
  transactions: Transaction[];
  customCategories?: CustomCategory[];
}) {
  const [period, setPeriod] = useState<AnalysisPeriodId>("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo(() => {
    if (period === "custom" && customStart && customEnd) {
      const [start, end] =
        customStart <= customEnd ? [customStart, customEnd] : [customEnd, customStart];
      return { start, end, label: "Custom" };
    }
    return resolvePeriod(period === "custom" ? "this-month" : period, todayISO());
  }, [period, customStart, customEnd]);

  const inRange = useMemo(
    () => transactionsInRange(transactions, range.start, range.end),
    [transactions, range.start, range.end],
  );
  const flow = useMemo(() => incomeVsExpense(inRange), [inRange]);
  const breakdown = useMemo(() => categoryBreakdown(inRange), [inRange]);
  const trend = useMemo(() => monthlyTrend(transactions, TREND_MONTHS, todayISO()), [transactions]);
  const trendMax = Math.max(1, ...trend.map((p) => Math.max(p.income, p.expenses)));
  const topAmount = breakdown[0]?.amount ?? 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Period switcher */}
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "text-body-s rounded-md border px-2.5 py-1.5",
              period === p.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <MonoLabel tone="subtle">From</MonoLabel>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <MonoLabel tone="subtle">To</MonoLabel>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </label>
        </div>
      ) : null}

      {/* Income vs expense */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="In" value={formatMoney(flow.income)} tone="text-success" />
        <Stat label="Out" value={formatMoney(flow.expenses)} tone="text-danger" />
        <Stat
          label="Net"
          value={formatMoney(flow.net)}
          tone={flow.net >= 0 ? "text-success" : "text-danger"}
        />
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col gap-2">
        <MonoLabel tone="subtle">Where it went</MonoLabel>
        {breakdown.length === 0 ? (
          <Text variant="body-s" tone="subtle">
            No spending in this period.
          </Text>
        ) : (
          breakdown.map((row) => {
            const meta = categoryMeta(row.category, customCategories);
            const Icon = categoryIcon(meta.icon);
            return (
              <div key={row.category} className="flex items-center gap-2.5">
                <div className="bg-elevated text-fg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Icon size={15} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Text variant="body-s" className="truncate">
                      {meta.label}
                    </Text>
                    <Text variant="caption" tone="subtle" className="tabular-nums">
                      {formatMoney(row.amount)} · {row.percent}%
                    </Text>
                  </div>
                  <div className="bg-elevated mt-1 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-accent h-full rounded-full"
                      style={{ width: `${Math.round((row.amount / topAmount) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Month-over-month trend */}
      <div className="flex flex-col gap-2">
        <MonoLabel tone="subtle">Last {TREND_MONTHS} months</MonoLabel>
        <div className="flex items-end justify-between gap-2">
          {trend.map((p) => (
            <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 items-end gap-0.5">
                <Bar value={p.income} max={trendMax} className="bg-success/70" title="Income" />
                <Bar value={p.expenses} max={trendMax} className="bg-danger/70" title="Expenses" />
              </div>
              <Text variant="caption" tone="subtle">
                {monthLabel(p.month)}
              </Text>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Legend className="bg-success/70" label="Income" />
          <Legend className="bg-danger/70" label="Expenses" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-border flex flex-col gap-0.5 rounded-md border p-2.5">
      <MonoLabel tone="subtle">{label}</MonoLabel>
      <span className={cn("text-heading-s font-mono tabular-nums", tone)}>{value}</span>
    </div>
  );
}

function Bar({
  value,
  max,
  className,
  title,
}: {
  value: number;
  max: number;
  className: string;
  title: string;
}) {
  const h = Math.round((value / max) * 100);
  return (
    <div
      className={cn("w-2 rounded-t-sm", className)}
      style={{ height: `${Math.max(value > 0 ? 4 : 0, h)}%` }}
      title={`${title}: ${formatMoney(value)}`}
    />
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      <Text variant="caption" tone="subtle">
        {label}
      </Text>
    </div>
  );
}
