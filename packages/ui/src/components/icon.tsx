import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "../lib/cn";

const ICON_SIZES = { sm: 14, md: 16, lg: 20, xl: 24 } as const;

export type IconSize = keyof typeof ICON_SIZES;

export interface IconProps extends Omit<LucideProps, "ref" | "size"> {
  /** A Lucide icon component. */
  icon: LucideIcon;
  size?: IconSize;
  /** Adds hover affordance for clickable icons. */
  interactive?: boolean;
}

/**
 * Token-sized wrapper around Lucide icons (03_DRD §2.5). Decorative by default
 * (aria-hidden); pass `aria-label` to expose it to assistive tech.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon: LucideComponent, size = "md", interactive = false, className, ...props },
  ref,
) {
  const px = ICON_SIZES[size];
  const hasLabel = typeof props["aria-label"] === "string";
  return (
    <LucideComponent
      ref={ref}
      width={px}
      height={px}
      strokeWidth={1.75}
      aria-hidden={hasLabel ? undefined : true}
      className={cn(
        "shrink-0",
        interactive && "text-fg-subtle hover:text-fg cursor-pointer transition-colors",
        className,
      )}
      {...props}
    />
  );
});
