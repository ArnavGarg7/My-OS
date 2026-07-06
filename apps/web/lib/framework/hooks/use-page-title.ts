"use client";

import { useEffect } from "react";
import { APP_NAME } from "@myos/shared/constants";

/**
 * Set the document title from a client component, formatted as "Title · My OS".
 * Restores the previous title on unmount. (Server routes should still export
 * `metadata` — this is for dynamic, client-derived titles.)
 */
export function usePageTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
