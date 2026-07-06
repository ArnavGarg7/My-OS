"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/use-theme";
import { IconButton } from "./button";

export interface ThemeToggleProps {
  className?: string;
}

/** Dark/light toggle button (03_DRD §2 / §11). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggle } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <IconButton
      aria-label={`Switch to ${next} mode`}
      onClick={toggle}
      className={className}
      variant="ghost"
      size="icon-sm"
    >
      {resolvedTheme === "dark" ? <Moon size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
    </IconButton>
  );
}
