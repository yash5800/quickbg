import { create } from "zustand";

interface ProcessingState {
  currentImageId: string | null;
  isSubmitting: boolean;
  setSubmitting: (imageId: string | null) => void;
  clearSubmitting: () => void;
}

export const useProcessingStore = create<ProcessingState>((set) => ({
  currentImageId: null,
  isSubmitting: false,
  setSubmitting: (imageId) => set({ currentImageId: imageId, isSubmitting: true }),
  clearSubmitting: () => set({ currentImageId: null, isSubmitting: false }),
}));