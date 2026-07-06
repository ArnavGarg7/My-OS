import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shimmer sweep (default) or a soft opacity pulse. */
  variant?: "shimmer" | "pulse";
}

/** Content placeholder (03_DRD §4.3 / §7). Never a spinner for content areas. */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = "shimmer", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "bg-elevated rounded-md",
        variant === "shimmer" &&
          "animate-shimmer from-elevated via-overlay to-elevated bg-gradient-to-r bg-[length:200%_100%]",
        variant === "pulse" && "animate-pulse-soft",
        className,
      )}
      {...props}
    />
  );
});
