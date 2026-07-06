import { forwardRef, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { Card } from "./card";

export type Trend = "up" | "down" | "flat";

export interface DeltaProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: string;
  trend?: Trend;
  /** Which direction should read as positive (colored success). Default "up". */
  goodDirection?: "up" | "down";
}

/** Directional change indicator (03_DRD §4.3 delta chip). */
export const Delta = forwardRef<HTMLSpanElement, DeltaProps>(function Delta(
  { value, trend = "flat", goodDirection = "up", className, ...props },
  ref,
) {
  const Arrow = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const isGood = trend === "flat" ? null : trend === goodDirection ? true : false;
  return (
    <span
      ref={ref}
      className={cn(
        "text-body-s inline-flex items-center gap-0.5 font-medium tabular-nums",
        isGood === null ? "text-fg-subtle" : isGood ? "text-success" : "text-danger",
        className,
      )}
      {...props}
    >
      <Arrow size={13} strokeWidth={2.25} aria-hidden />
      {value}
    </span>
  );
});

export interface StatBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
}

/** Compact label + value stat (03_DRD §4.3 StatCard, inline form). */
export const StatBlock = forwardRef<HTMLDivElement, StatBlockProps>(function StatBlock(
  { label, value, delta, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
      <span className="text-label text-fg-subtle">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-heading-l text-fg font-mono tabular-nums">{value}</span>
        {delta}
      </div>
    </div>
  );
});

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  icon?: LucideIcon;
  /** e.g. a sparkline. */
  footer?: ReactNode;
}

/** Dashboard metric card (03_DRD §4.3). */
export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(function MetricCard(
  { label, value, delta, icon: IconComponent, footer, className, ...props },
  ref,
) {
  return (
    <Card
      ref={ref}
      variant="standard"
      padding="md"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-label text-fg-subtle">{label}</span>
        {IconComponent ? <IconComponent size={16} className="text-fg-subtle" aria-hidden /> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-display-m text-fg font-mono tabular-nums">{value}</span>
        {delta}
      </div>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </Card>
  );
});

export interface MetricWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  /** Chart / visual area. */
  children?: ReactNode;
}

/** Metric with an embedded visual area (03_DRD §4.3 chart-bearing widget). */
export const MetricWidget = forwardRef<HTMLDivElement, MetricWidgetProps>(function MetricWidget(
  { label, value, delta, className, children, ...props },
  ref,
) {
  return (
    <Card
      ref={ref}
      variant="elevated"
      padding="md"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-label text-fg-subtle">{label}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-heading-xl text-fg font-mono tabular-nums">{value}</span>
            {delta}
          </div>
        </div>
      </div>
      {children ? <div className="h-16 w-full">{children}</div> : null}
    </Card>
  );
});
