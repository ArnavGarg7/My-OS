"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../hooks/use-persistent-state";
import { STORAGE_KEYS } from "../persistence";

/** Generic, persisted UI preferences (extend as features need them). */
export interface Preferences {
  reduceMotion: boolean;
  compactDensity: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  reduceMotion: false,
  compactDensity: false,
};

interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = usePersistentState<Preferences>(
    STORAGE_KEYS.preferences,
    DEFAULT_PREFERENCES,
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setPreference: (key, val) =>
        setPreferences((prev) => ({ ...prev, [key]: val }) as Preferences),
      reset: () => setPreferences(DEFAULT_PREFERENCES),
    }),
    [preferences, setPreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within <AppProvider>");
  return ctx;
}
