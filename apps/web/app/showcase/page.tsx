"use client";

import { ThemeProvider, ToastProvider, TooltipProvider } from "@myos/ui";
import { ShowcaseContent } from "./showcase-content";

/**
 * Design System Showcase — a DEVELOPMENT-ONLY reference page (Sprint 1.2).
 * Renders every @myos/ui component and its states. Not an application feature.
 */
export default function ShowcasePage() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider delayDuration={300}>
        <ToastProvider>
          <main className="bg-base min-h-dvh">
            <ShowcaseContent />
          </main>
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
