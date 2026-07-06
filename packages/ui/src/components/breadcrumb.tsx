import { forwardRef, Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "../lib/cn";

export interface BreadcrumbItemData {
  label: string;
  /** Omit on the current (last) item. */
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: BreadcrumbItemData[];
}

/** Path breadcrumb (03_DRD §5). Last item is the current page (aria-current). */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { items, className, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn("flex items-center", className)}
      {...props}
    >
      <ol className="text-body-s flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="flex items-center">
                {isLast ? (
                  <span aria-current="page" className="text-fg font-medium">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a
                    href={item.href}
                    className="text-fg-muted hover:text-fg focus-visible:ring-ring rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="text-fg-muted hover:text-fg focus-visible:ring-ring rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                  >
                    {item.label}
                  </button>
                )}
              </li>
              {isLast ? null : (
                <li aria-hidden className="text-fg-subtle">
                  <ChevronRight size={13} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
});

/** Escape hatch for fully custom breadcrumb content. */
export const BreadcrumbRoot = Slot.Root;
