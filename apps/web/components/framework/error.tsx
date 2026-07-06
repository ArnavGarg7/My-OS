"use client";

import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Lock, RotateCw, SearchX } from "lucide-react";
import { Button, EmptyState, Skeleton, cn } from "@myos/ui";

/** Consistent retry action. */
export function RetryButton({
  onClick,
  label = "Try again",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      leftIcon={<RotateCw size={15} aria-hidden />}
    >
      {label}
    </Button>
  );
}

/** Generic fallback UI shared by the error boundary + page/section errors. */
export function Fallback({
  error,
  reset,
  title = "Something went wrong",
  compact = false,
}: {
  error?: Error;
  reset?: () => void;
  title?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "p-6" : "min-h-64 p-10",
      )}
    >
      <span className="bg-danger-subtle text-danger flex size-11 items-center justify-center rounded-full">
        <AlertTriangle size={20} aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-heading-s text-fg">{title}</p>
        {error?.message ? (
          <p className="text-body-s text-fg-subtle mx-auto max-w-sm font-mono">{error.message}</p>
        ) : null}
      </div>
      {reset ? <RetryButton onClick={reset} /> : null}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** React error boundary. Wrap the app (and any risky subtree) with it. */
export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return this.props.fallback ? (
        this.props.fallback(error, this.reset)
      ) : (
        <Fallback error={error} reset={this.reset} />
      );
    }
    return this.props.children;
  }
}

/** Inline error for a single section/card that failed. */
export function SectionError({
  title = "Couldn’t load this section",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-border bg-surface/40 rounded-lg border border-dashed">
      <Fallback
        compact
        title={title}
        {...(message ? { error: new Error(message) } : {})}
        {...(onRetry ? { reset: onRetry } : {})}
      />
    </div>
  );
}

/** Full-page error state. */
export function PageError({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Fallback
        title={title}
        {...(message ? { error: new Error(message) } : {})}
        {...(onRetry ? { reset: onRetry } : {})}
      />
    </div>
  );
}

/** Preset 404. */
export function NotFound({ action }: { action?: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved."
        {...(action ? { action } : {})}
      />
    </div>
  );
}

/** Preset 401/403. */
export function Unauthorized({ action }: { action?: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={Lock}
        title="Access denied"
        description="You don’t have permission to view this."
        {...(action ? { action } : {})}
      />
    </div>
  );
}

/** Skeleton for a whole page (header + rows). */
export function SkeletonPage({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto flex h-full max-w-[var(--container-content)] flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Suspense wrapper with a page skeleton fallback by default. */
export function LoadingBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback ?? <SkeletonPage />}>{children}</Suspense>;
}
