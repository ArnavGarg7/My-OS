"use client";

import { useCallback, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton, Text, cn } from "@myos/ui";
import { useResizePanel, type ResizeEdge } from "@/lib/framework/hooks/use-resize-panel";
import { useWorkspace } from "@/lib/framework/providers/workspace";
import type { StorageKey } from "@/lib/framework/persistence";

/**
 * Workspace framework (Sprint 1.4, Part 8). Reusable containers every module
 * composes from. Infrastructure only.
 */

/** Standard workspace: full-height vertical stack. */
export function Workspace({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-full min-h-0 flex-col", className)}>{children}</div>;
}

/** A scroll region that fills its parent. */
export function ScrollableWorkspace({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("h-full min-h-0 overflow-y-auto", className)}>{children}</div>;
}

/** Centered narrow column for distraction-free content. */
export function FocusWorkspace({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto h-full w-full max-w-[var(--container-prose)] overflow-y-auto px-4 py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Sticky toolbar for the top of a workspace. */
export function StickyToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-base/80 sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface ResizablePanelProps {
  children: ReactNode;
  edge?: ResizeEdge;
  min: number;
  max: number;
  initial: number;
  storageKey?: StorageKey;
  className?: string;
}

/** Generic resizable panel with a drag handle. Optionally persists its size. */
export function ResizablePanel({
  children,
  edge = "right",
  min,
  max,
  initial,
  storageKey,
  className,
}: ResizablePanelProps) {
  const { size, isResizing, handleProps } = useResizePanel({
    initial,
    min,
    max,
    edge,
    ...(storageKey ? { storageKey } : {}),
  });
  const horizontal = edge === "left" || edge === "right";

  return (
    <div
      style={horizontal ? { width: size } : { height: size }}
      className={cn("relative shrink-0", className)}
    >
      {children}
      <div
        {...handleProps}
        aria-hidden
        className={cn(
          "absolute z-10",
          horizontal ? "inset-y-0 w-2 cursor-col-resize" : "inset-x-0 h-2 cursor-row-resize",
          edge === "right" && "-right-1",
          edge === "left" && "-left-1",
          edge === "bottom" && "-bottom-1",
          edge === "top" && "-top-1",
        )}
      >
        <div
          className={cn(
            "transition-colors",
            horizontal ? "mx-auto h-full w-px" : "my-auto h-px w-full",
            isResizing ? "bg-accent" : "hover:bg-border-strong bg-transparent",
          )}
        />
      </div>
    </div>
  );
}

export interface SplitLayoutProps {
  primary: ReactNode;
  secondary: ReactNode;
  /** Which side the resizable secondary panel is on. */
  side?: "left" | "right";
  initialSize?: number;
  min?: number;
  max?: number;
  storageKey?: StorageKey;
  className?: string;
}

/** Two-pane split with a resizable secondary panel. */
export function SplitLayout({
  primary,
  secondary,
  side = "left",
  initialSize = 280,
  min = 200,
  max = 480,
  storageKey,
  className,
}: SplitLayoutProps) {
  const panel = (
    <ResizablePanel
      edge={side === "left" ? "right" : "left"}
      initial={initialSize}
      min={min}
      max={max}
      className={cn(
        "overflow-y-auto",
        side === "left" ? "border-border border-r" : "border-border border-l",
      )}
      {...(storageKey ? { storageKey } : {})}
    >
      {secondary}
    </ResizablePanel>
  );
  const content = <div className="min-w-0 flex-1 overflow-y-auto">{primary}</div>;

  return (
    <div className={cn("flex h-full min-h-0", className)}>
      {side === "left" ? (
        <>
          {panel}
          {content}
        </>
      ) : (
        <>
          {content}
          {panel}
        </>
      )}
    </div>
  );
}

/** Right-hand inspector, controlled by the WorkspaceProvider (open + width). */
export function InspectorPanel({
  children,
  title = "Inspector",
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  const { inspectorOpen, inspectorWidth, setInspectorWidth, setInspectorOpen } = useWorkspace();
  const [resizing, setResizing] = useState(false);

  const onResize = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = inspectorWidth;
      setResizing(true);
      document.body.style.cursor = "col-resize";
      const onMove = (moveEvent: PointerEvent) => {
        const next = Math.min(560, Math.max(280, startWidth - (moveEvent.clientX - startX)));
        setInspectorWidth(next);
      };
      const onUp = () => {
        setResizing(false);
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [inspectorWidth, setInspectorWidth],
  );

  if (!inspectorOpen) return null;

  return (
    <aside
      style={{ width: inspectorWidth }}
      className={cn("border-border bg-surface relative flex shrink-0 flex-col border-l", className)}
    >
      <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-4">
        <Text variant="heading-s">{title}</Text>
        <IconButton
          aria-label="Close inspector"
          size="icon-sm"
          variant="ghost"
          onClick={() => setInspectorOpen(false)}
        >
          <X size={16} aria-hidden />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      <div
        onPointerDown={onResize}
        aria-hidden
        className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize"
      >
        <div
          className={cn(
            "h-full w-px transition-colors",
            resizing ? "bg-accent" : "hover:bg-border-strong bg-transparent",
          )}
        />
      </div>
    </aside>
  );
}

/** Main content + right inspector (driven by the WorkspaceProvider). */
export function InspectorLayout({
  children,
  inspector,
  className,
}: {
  children: ReactNode;
  inspector: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0", className)}>
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      <InspectorPanel>{inspector}</InspectorPanel>
    </div>
  );
}
