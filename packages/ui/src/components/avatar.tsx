"use client";

import { forwardRef } from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "../lib/cn";

const AVATAR_SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-body-s",
  lg: "size-10 text-body-m",
  xl: "size-12 text-heading-s",
} as const;

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: keyof typeof AVATAR_SIZES;
}

/** User avatar (03_DRD §4.3). Falls back to initials. */
export const Avatar = forwardRef<React.ComponentRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  function Avatar({ className, size = "md", ...props }, ref) {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "bg-accent-muted text-accent relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-medium",
          AVATAR_SIZES[size],
          className,
        )}
        {...props}
      />
    );
  },
);

export const AvatarImage = forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
});

export const AvatarFallback = forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn("flex size-full items-center justify-center uppercase", className)}
      {...props}
    />
  );
});
