"use client";

import { useEffect, useState } from "react";

/** Tracks whether the window/tab is focused + visible (06/02: pause polling, etc.). */
export function useWindowFocus(): boolean {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    const update = () => setFocused(document.hasFocus() && document.visibilityState === "visible");
    update();
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return focused;
}
