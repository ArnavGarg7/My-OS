import { EmptyState, PageHeader } from "@myos/ui";
import type { NavItem } from "@/lib/shell/nav";

/**
 * Consistent placeholder for every not-yet-built module (Sprint 1.3). Renders
 * the page header + a centered EmptyState. Server-compatible (no client hooks).
 */
export function PagePlaceholder({ item }: { item: NavItem }) {
  return (
    <div className="mx-auto flex h-full max-w-[var(--container-content)] flex-col gap-6 px-4 py-6 sm:px-6">
      <PageHeader title={item.label} description={item.description} />
      <div className="border-border bg-surface/40 flex flex-1 items-center justify-center rounded-xl border border-dashed">
        <EmptyState
          icon={item.icon}
          title={`${item.label} · Coming in Phase 2`}
          description="This module will be implemented in Phase 2."
        />
      </div>
    </div>
  );
}
