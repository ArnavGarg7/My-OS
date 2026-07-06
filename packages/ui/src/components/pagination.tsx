import { forwardRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { IconButton } from "./button";

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Sibling pages shown around the current page. */
  siblings?: number;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPages(page: number, pageCount: number, siblings: number): (number | "…")[] {
  const total = siblings * 2 + 5;
  if (pageCount <= total) return range(1, pageCount);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, pageCount);
  const showLeftDots = left > 2;
  const showRightDots = right < pageCount - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, siblings * 2 + 3), "…", pageCount];
  }
  if (showLeftDots && !showRightDots) {
    return [1, "…", ...range(pageCount - (siblings * 2 + 2), pageCount)];
  }
  return [1, "…", ...range(left, right), "…", pageCount];
}

/** Page navigation (03_DRD §5). Emits page changes; holds no routing. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, pageCount, onPageChange, siblings = 1, className, ...props },
  ref,
) {
  const pages = buildPages(page, pageCount, siblings);
  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <IconButton
        aria-label="Previous page"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} aria-hidden />
      </IconButton>
      {pages.map((value, index) =>
        value === "…" ? (
          <span key={`dots-${index}`} className="text-body-s text-fg-subtle px-1.5" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={value}
            type="button"
            aria-current={value === page ? "page" : undefined}
            onClick={() => onPageChange(value)}
            className={cn(
              "text-body-s inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 tabular-nums outline-none transition-colors",
              "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
              value === page
                ? "bg-accent-muted text-accent font-medium"
                : "text-fg-muted hover:bg-elevated hover:text-fg",
            )}
          >
            {value}
          </button>
        ),
      )}
      <IconButton
        aria-label="Next page"
        size="icon-sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={16} aria-hidden />
      </IconButton>
    </nav>
  );
});
