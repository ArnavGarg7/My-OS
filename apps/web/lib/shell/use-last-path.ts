"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { appStorage, STORAGE_KEYS } from "@/lib/framework/persistence";

export const LAST_PATH_KEY = STORAGE_KEYS.lastRoute;

/** Persist the last visited shell route so `/` can restore it on next load. */
export function useLastPath(): void {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname && pathname !== "/") {
      appStorage.set(STORAGE_KEYS.lastRoute, pathname);
    }
  }, [pathname]);
}
