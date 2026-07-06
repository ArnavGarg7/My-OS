"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@myos/ui";

export interface ModalOptions {
  size?: "sm" | "md" | "lg" | "xl";
  title?: string;
  description?: string;
  /** Allow Esc / overlay dismiss. Default true. */
  dismissible?: boolean;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface AlertOptions {
  title: string;
  description?: string;
  actionLabel?: string;
}

type ModalKind =
  | { kind: "custom"; render: (close: () => void) => ReactNode }
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "alert"; options: AlertOptions; resolve: () => void };

interface ModalEntry {
  id: string;
  options: ModalOptions;
  body: ModalKind;
}

interface ModalContextValue {
  open: (render: (close: () => void) => ReactNode, options?: ModalOptions) => string;
  close: (id: string) => void;
  closeAll: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

let modalCounter = 0;
const nextId = () => `modal-${++modalCounter}`;

/**
 * ModalProvider — the Dialog + Modal Managers. Open modals imperatively, and
 * use `confirm()` / `alert()` for promise-based prompts. No feature logic.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ModalEntry[]>([]);

  const close = useCallback((id: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry?.body.kind === "confirm") entry.body.resolve(false);
      if (entry?.body.kind === "alert") entry.body.resolve();
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const closeAll = useCallback(() => {
    setEntries((prev) => {
      for (const entry of prev) {
        if (entry.body.kind === "confirm") entry.body.resolve(false);
        if (entry.body.kind === "alert") entry.body.resolve();
      }
      return [];
    });
  }, []);

  const open = useCallback(
    (render: (close: () => void) => ReactNode, options: ModalOptions = {}) => {
      const id = nextId();
      setEntries((prev) => [...prev, { id, options, body: { kind: "custom", render } }]);
      return id;
    },
    [],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        const id = nextId();
        setEntries((prev) => [
          ...prev,
          {
            id,
            options: { size: "sm", dismissible: true },
            body: {
              kind: "confirm",
              options,
              resolve: (value) => {
                setEntries((list) => list.filter((e) => e.id !== id));
                resolve(value);
              },
            },
          },
        ]);
      }),
    [],
  );

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        const id = nextId();
        setEntries((prev) => [
          ...prev,
          {
            id,
            options: { size: "sm", dismissible: true },
            body: {
              kind: "alert",
              options,
              resolve: () => {
                setEntries((list) => list.filter((e) => e.id !== id));
                resolve();
              },
            },
          },
        ]);
      }),
    [],
  );

  const value = useMemo<ModalContextValue>(
    () => ({ open, close, closeAll, confirm, alert }),
    [open, close, closeAll, confirm, alert],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {entries.map((entry) => (
        <Dialog
          key={entry.id}
          open
          onOpenChange={(next) => {
            if (!next && entry.options.dismissible !== false) close(entry.id);
          }}
        >
          <DialogContent size={entry.options.size ?? "md"}>
            {entry.body.kind === "custom" ? (
              <>
                {entry.options.title ? (
                  <DialogHeader>
                    <DialogTitle>{entry.options.title}</DialogTitle>
                    {entry.options.description ? (
                      <DialogDescription>{entry.options.description}</DialogDescription>
                    ) : null}
                  </DialogHeader>
                ) : (
                  <DialogTitle className="sr-only">{entry.options.title ?? "Dialog"}</DialogTitle>
                )}
                {entry.body.render(() => close(entry.id))}
              </>
            ) : entry.body.kind === "confirm" ? (
              <>
                <DialogHeader>
                  <DialogTitle>{entry.body.options.title}</DialogTitle>
                  {entry.body.options.description ? (
                    <DialogDescription>{entry.body.options.description}</DialogDescription>
                  ) : null}
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => entry.body.kind === "confirm" && entry.body.resolve(false)}
                  >
                    {entry.body.options.cancelLabel ?? "Cancel"}
                  </Button>
                  <Button
                    variant={entry.body.options.destructive ? "danger" : "primary"}
                    onClick={() => entry.body.kind === "confirm" && entry.body.resolve(true)}
                  >
                    {entry.body.options.confirmLabel ?? "Confirm"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{entry.body.options.title}</DialogTitle>
                  {entry.body.options.description ? (
                    <DialogDescription>{entry.body.options.description}</DialogDescription>
                  ) : null}
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => entry.body.kind === "alert" && entry.body.resolve()}>
                    {entry.body.options.actionLabel ?? "OK"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      ))}
    </ModalContext.Provider>
  );
}

export function useModal(): Pick<ModalContextValue, "open" | "close" | "closeAll"> {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within <AppProvider>");
  return ctx;
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useConfirm must be used within <AppProvider>");
  return ctx.confirm;
}

export function useAlert(): (options: AlertOptions) => Promise<void> {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useAlert must be used within <AppProvider>");
  return ctx.alert;
}
