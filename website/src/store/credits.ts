import { create } from "zustand";

const CREDITS_STORAGE_KEY = "quickbg_credits";

interface CreditsState {
  remaining: number;
  resetInSeconds: number;
  resetAt: number;
  lastUpdated: number;
  isInitialized: boolean;
  setCredits: (remaining: number, resetInSeconds: number) => void;
  consumeCredit: () => void;
  restoreFromStorage: () => void;
}

function persistCredits(state: Partial<CreditsState>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify({
      remaining: state.remaining,
      resetAt: state.resetAt,
      lastUpdated: state.lastUpdated,
      isInitialized: state.isInitialized,
    }));
  } catch {
    // storage full or unavailable
  }
}

export const useCreditsStore = create<CreditsState>((set) => ({
  remaining: 25,
  resetInSeconds: 3600,
  resetAt: Date.now() + 3600 * 1000,
  lastUpdated: Date.now(),
  isInitialized: false,
  setCredits: (remaining, resetInSeconds) => {
    const now = Date.now();
    set((state) => {
      const safeRemaining = Number.isFinite(remaining) ? remaining : state.remaining;
      const safeResetInSeconds = Number.isFinite(resetInSeconds) ? resetInSeconds : state.resetInSeconds;
      const newState = {
        remaining: safeRemaining,
        resetInSeconds: safeResetInSeconds,
        resetAt: now + safeResetInSeconds * 1000,
        lastUpdated: now,
        isInitialized: true,
      };
      persistCredits(newState);
      return newState;
    });
  },
  consumeCredit: () => {
    const now = Date.now();
    set((state) => {
      const newState = {
        remaining: Math.max(0, state.remaining - 1),
        resetInSeconds: state.resetInSeconds,
        resetAt: state.resetAt,
        lastUpdated: now,
        isInitialized: true,
      };
      persistCredits(newState);
      return newState;
    });
  },
  restoreFromStorage: () => {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.remaining === "number" && typeof data.resetAt === "number") {
        set({
          remaining: data.remaining,
          resetAt: data.resetAt,
          lastUpdated: data.lastUpdated ?? Date.now(),
          isInitialized: data.isInitialized ?? true,
        });
      }
    } catch {
      // ignore
    }
  },
}));
