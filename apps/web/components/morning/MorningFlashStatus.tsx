"use client";

import { CheckCircle2 } from "lucide-react";
import { useMorningFlash } from "@/lib/today/morning-flash";

/** Status-bar flash shown briefly after completing the morning briefing. */
export function MorningFlashStatus() {
  const active = useMorningFlash((s) => s.active);
  if (!active) return null;
  return (
    <div className="text-success flex items-center gap-1.5">
      <CheckCircle2 size={12} aria-hidden />
      <span className="font-medium">Morning Complete ✓</span>
    </div>
  );
}
