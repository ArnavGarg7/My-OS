"use client";

import { Text } from "@myos/ui";
import type { ReactNode } from "react";

/**
 * DashboardLayout (Sprint 4.4). A titled card wrapper for a dashboard widget. Layout only —
 * it carries no data and no logic, so the executive view is a grid of these over the
 * composed read models.
 */
export function DashboardLayout({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-border-subtle flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <Text variant="heading-s">{title}</Text>
        {action}
      </div>
      {children}
    </section>
  );
}
