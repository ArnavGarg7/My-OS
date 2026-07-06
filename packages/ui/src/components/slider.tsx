"use client";

import { forwardRef } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "../lib/cn";

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

/** Range slider (03_DRD §4.2). Supports one or many thumbs. */
export const Slider = forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  function Slider({ className, ...props }, ref) {
    const thumbCount = Array.isArray(props.value)
      ? props.value.length
      : Array.isArray(props.defaultValue)
        ? props.defaultValue.length
        : 1;
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50",
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track className="bg-inset relative h-1.5 w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Range className="bg-accent absolute h-full rounded-full" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "border-accent bg-base block size-4 rounded-full border-2 shadow-sm outline-none transition-colors",
              "hover:border-accent-hover focus-visible:ring-ring focus-visible:ring-offset-base focus-visible:ring-2 focus-visible:ring-offset-2",
            )}
          />
        ))}
      </SliderPrimitive.Root>
    );
  },
);
