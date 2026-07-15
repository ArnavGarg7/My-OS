import { create } from "zustand";

/**
 * Transient "Morning Complete ✓" flash (Sprint 2.2). Set on completion; the
 * status bar shows it briefly, then it auto-clears.
 */
interface MorningFlashState {
  active: boolean;
  flash: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useMorningFlash = create<MorningFlashState>((set) => ({
  active: false,
  flash: () => {
    set({ active: true });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => set({ active: false }), 4000);
  },
}));
