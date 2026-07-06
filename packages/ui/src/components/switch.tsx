"use client";

import { forwardRef } from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "../lib/cn";

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

/** Toggle switch, 32×18 (03_DRD §4.2). */
export const Switch = forwardRef<React.ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  function Switch({ className, ...props }, ref) {
    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(
          "bg-border-strong inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors",
          "data-[state=checked]:bg-accent",
          "focus-visible:ring-ring focus-visible:ring-offset-base focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block size-3.5 translate-x-[2px] rounded-full bg-white shadow-sm transition-transform",
            "data-[state=checked]:translate-x-[16px]",
          )}
        />
      </SwitchPrimitive.Root>
    );
  },
);
