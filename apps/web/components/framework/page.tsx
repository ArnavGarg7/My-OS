import type { ReactNode } from "react";
import { Spinner, cn } from "@myos/ui";

/**
 * Page framework (Sprint 1.4, Part 1). Composable layout primitives — every
 * module builds its page from these instead of hand-rolling layout. All are
 * presentational (server-compatible) and token-styled.
 */

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** content = 1200px · prose = 45rem · full = fluid. */
  width?: "content" | "prose" | "full";
}

/** Outer vertical page frame with the standard gutters + max width. */
export function PageContainer({ children, className, width = "content" }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex h-full min-h-0 flex-col gap-4 px-4 py-6 sm:px-6",
        width === "content" && "max-w-[var(--container-content)]",
        width === "prose" && "max-w-[var(--container-prose)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Row of filters / view switches / actions. Sticky by default. */
export function PageToolbar({
  children,
  className,
  sticky = true,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-border flex items-center gap-2 border-b pb-3",
        sticky && "bg-base/80 sticky top-0 z-10 -mx-4 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The main content region — grows and scrolls. */
export function PageContent({
  children,
  className,
  scroll = true,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <div className={cn("min-h-0 flex-1", scroll && "overflow-y-auto", className)}>{children}</div>
  );
}

/** A secondary in-page column (for split modules). */
export function PageSidebar({
  children,
  className,
  side = "left",
  width = 240,
}: {
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
  width?: number;
}) {
  return (
    <aside
      style={{ width }}
      className={cn(
        "hidden shrink-0 overflow-y-auto md:block",
        side === "left" ? "border-border border-r" : "border-border border-l",
        className,
      )}
    >
      {children}
    </aside>
  );
}

/** Bottom action / meta row. */
export function PageFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-border flex items-center gap-2 border-t pt-3", className)}>
      {children}
    </div>
  );
}

/** Centered loading state for a page (spinner + label). */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-body-s text-fg-subtle">{label}</span>
      </div>
    </div>
  );
}
