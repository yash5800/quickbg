import { create } from "zustand";

/**
 * Display-only credit state. The server (`/api/queue-status`, `/api/credits/*`)
 * is the single source of truth — this store NEVER computes credits locally and
 * NEVER persists them. It only mirrors the last authoritative value the server
 * returned, so the badge can render it. `isInitialized` gates the UI until the
 * first server response arrives (avoids showing a guessed default).
 */
interface CreditsState {
  remaining: number;
  resetInSeconds: number;
  resetAt: number;
  isInitialized: boolean;
  /** Apply an authoritative balance returned by the server. */
  setFromServer: (remaining: number, resetInSeconds: number) => void;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  remaining: 0,
  resetInSeconds: 3600,
  resetAt: 0,
  isInitialized: false,
  setFromServer: (remaining, resetInSeconds) => {
    set((state) => {
      const safeRemaining = Number.isFinite(remaining) ? remaining : state.remaining;
      const safeResetInSeconds = Number.isFinite(resetInSeconds) ? resetInSeconds : state.resetInSeconds;
      return {
        remaining: safeRemaining,
        resetInSeconds: safeResetInSeconds,
        resetAt: Date.now() + safeResetInSeconds * 1000,
        isInitialized: true,
      };
    });
  },
}));
