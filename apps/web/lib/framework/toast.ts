"use client";

import { useMemo } from "react";
import { useToast, type ToastOptions, type ToastVariant } from "@myos/ui";
import type { ReactNode } from "react";

export interface Toaster {
  message: (title: ReactNode, description?: ReactNode) => string;
  success: (title: ReactNode, description?: ReactNode) => string;
  error: (title: ReactNode, description?: ReactNode) => string;
  warning: (title: ReactNode, description?: ReactNode) => string;
  info: (title: ReactNode, description?: ReactNode) => string;
  custom: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

/**
 * Toast Manager (Sprint 1.4) — a semantic wrapper over the design-system
 * `useToast`. `toaster.success("Saved")` instead of raw option objects.
 */
export function useToaster(): Toaster {
  const { toast, dismiss } = useToast();

  return useMemo<Toaster>(() => {
    const make =
      (variant: ToastVariant) =>
      (title: ReactNode, description?: ReactNode): string =>
        toast({ variant, title, ...(description === undefined ? {} : { description }) });

    return {
      message: make("default"),
      success: make("success"),
      error: make("danger"),
      warning: make("warning"),
      info: make("info"),
      custom: (options) => toast(options),
      dismiss,
    };
  }, [toast, dismiss]);
}
