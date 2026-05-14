import { create } from "zustand";

interface CreditsState {
  remaining: number;
  resetInSeconds: number;
  resetAt: number;
  lastUpdated: number;
  setCredits: (remaining: number, resetInSeconds: number) => void;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  remaining: 25,
  resetInSeconds: 3600,
  resetAt: Date.now() + 3600 * 1000,
  lastUpdated: Date.now(),
  setCredits: (remaining, resetInSeconds) => {
    const now = Date.now();
    set((state) => {
      const safeRemaining = Number.isFinite(remaining) ? remaining : state.remaining;
      const safeResetInSeconds = Number.isFinite(resetInSeconds) ? resetInSeconds : state.resetInSeconds;

      return {
        remaining: safeRemaining,
        resetInSeconds: safeResetInSeconds,
        resetAt: now + safeResetInSeconds * 1000,
        lastUpdated: now,
      };
    });
  },
}));
