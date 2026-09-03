import { forwardRef, type ReactNode } from "react";
import { PanelRight } from "lucide-react";
import { cn } from "../lib/cn";
import { MonoLabel } from "./mono-label";
import { Text } from "./typography";

/**
 * Contextual Inspector primitives (V2 Stage 1). The Inspector is a core My OS
 * interaction pattern: selecting a task, event, project or note opens a
 * right-edge drawer that answers, in order —
 *
 *   CONTEXT        what this is and why it matters
 *   STATUS         what is happening
 *   RELATIONSHIPS  what it connects to
 *   INTELLIGENCE   what My OS knows / recommends
 *   ACTIONS        what you can do
 *
 * These primitives give every module the same structure. The drawer itself is
 * owned by the shell (ContextPanel); modules render `<InspectorBody>` into it.
 */

/** Scroll container + consistent padding for an inspector's contents. */
export const InspectorBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function InspectorBody({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-5 p-4", className)} {...props} />;
  },
);

export interface InspectorSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** e.g. "Context", "Status", "Relationships", "Intelligence", "Actions". */
  label: string;
  /** Optional trailing content in the section header. */
  aside?: ReactNode;
}

/** A labelled inspector section with a mono micro-header. */
export const InspectorSection = forwardRef<HTMLDivElement, InspectorSectionProps>(
  function InspectorSection({ label, aside, className, children, ...props }, ref) {
    return (
      <section ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        <div className="flex items-center justify-between">
          <MonoLabel tone="subtle">{label}</MonoLabel>
          {aside}
        </div>
        {children}
      </section>
    );
  },
);

export interface InspectorRowProps {
  label: ReactNode;
  value: ReactNode;
  /** Render the value in the mono/telemetry style. */
  mono?: boolean;
  className?: string;
}

/** A key / value row — label left, value right-aligned (mono optional). */
export function InspectorRow({ label, value, mono = false, className }: InspectorRowProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-0.5", className)}>
      <Text variant="body-s" tone="muted" className="shrink-0">
        {label}
      </Text>
      <span
        className={cn(
          "min-w-0 truncate text-right",
          mono ? "text-fg-muted text-caption font-mono tabular-nums" : "text-body-s text-fg",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** The Inspector's resting state — nothing selected. */
export function InspectorEmpty({
  title = "Nothing selected",
  hint = "Select any task, note, or event across your workspace to view its context and actions here.",
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 p-4">
      <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border">
        <PanelRight size={15} aria-hidden />
      </span>
      <Text variant="heading-s">{title}</Text>
      <Text variant="body-s" tone="subtle" className="max-w-[34ch]">
        {hint}
      </Text>
    </div>
  );
}
