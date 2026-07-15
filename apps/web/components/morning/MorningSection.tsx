import type { ReactNode } from "react";
import { cn } from "@myos/ui";

/**
 * Editorial section wrapper for the Morning Briefing (Sprint 2.2). Generous
 * vertical rhythm + a subtle divider — a report you read top to bottom, not a
 * grid of cards.
 */
export function MorningSection({
  id,
  label,
  children,
  className,
}: {
  id?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      {...(id ? { id } : {})}
      className={cn("border-border/60 scroll-mt-4 border-b py-8 last:border-0", className)}
    >
      {label ? (
        <div className="text-label text-fg-subtle mb-4 uppercase tracking-wide">{label}</div>
      ) : null}
      {children}
    </section>
  );
}
