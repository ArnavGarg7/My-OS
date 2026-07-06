"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../lib/cn";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** ms before auto-dismiss. Overrides the provider default. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Imperative toast API (03_DRD §4.4). Must be used within `<ToastProvider>`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const ICONS = {
  default: null,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
  info: Info,
} as const;

const ICON_TONE = {
  default: "",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
} as const;

function ToastItem({
  data,
  defaultDuration,
  onClose,
}: {
  data: ToastRecord;
  defaultDuration: number;
  onClose: () => void;
}) {
  const variant = data.variant ?? "default";
  const IconComponent = ICONS[variant];
  return (
    <ToastPrimitive.Root
      duration={data.duration ?? defaultDuration}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className={cn(
        "border-border bg-overlay shadow-e3 flex items-start gap-3 rounded-lg border p-3.5",
        "data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:transition-transform",
      )}
    >
      {IconComponent ? (
        <IconComponent
          size={18}
          className={cn("mt-0.5 shrink-0", ICON_TONE[variant])}
          aria-hidden
        />
      ) : null}
      <div className="flex-1 space-y-0.5">
        {data.title ? (
          <ToastPrimitive.Title className="text-body-m text-fg font-medium">
            {data.title}
          </ToastPrimitive.Title>
        ) : null}
        {data.description ? (
          <ToastPrimitive.Description className="text-body-s text-fg-muted">
            {data.description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      {data.action ? (
        <ToastPrimitive.Action asChild altText={data.action.label}>
          <button
            type="button"
            onClick={data.action.onClick}
            className="text-body-s text-accent hover:bg-accent-muted focus-visible:ring-ring shrink-0 rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            {data.action.label}
          </button>
        </ToastPrimitive.Action>
      ) : null}
      <ToastPrimitive.Close
        className="text-fg-subtle hover:text-fg focus-visible:ring-ring shrink-0 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
        aria-label="Dismiss"
      >
        <X size={15} aria-hidden />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Default auto-dismiss in ms. */
  duration?: number;
}

/** Wrap the app once. Renders the toast viewport (bottom-center, 03_DRD §4.4). */
export function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider duration={duration} swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem key={t.id} data={t} defaultDuration={duration} onClose={() => dismiss(t.id)} />
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 left-1/2 z-[100] flex max-h-screen w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 p-4 outline-none sm:bottom-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
