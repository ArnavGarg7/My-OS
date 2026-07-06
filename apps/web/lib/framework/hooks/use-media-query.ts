"use client";

import { useEffect, useState } from "react";

/** Reactive media query. SSR-safe (returns `false` until mounted). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** Breakpoints aligned with the shell (03_DRD §3): mobile < 768 ≤ tablet < 1024 ≤ desktop. */
export function useBreakpoint(): { isMobile: boolean; isTablet: boolean; isDesktop: boolean } {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  return {
    isMobile: !isTabletUp,
    isTablet: isTabletUp && !isDesktop,
    isDesktop,
  };
}
