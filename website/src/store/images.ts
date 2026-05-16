import { create } from "zustand";
import { ImageItem, ImageWaitingReason } from "@/types/image";

const TERMINAL_STATUSES: Array<ImageItem["status"]> = ["completed", "failed", "error"];
const DEFAULT_TERMINAL_RETENTION_MS = 10 * 60 * 1000;

interface ImagesState {
  images: ImageItem[];
  setImages: (images: ImageItem[]) => void;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  updateImageStatus: (id: string, status: ImageItem["status"], data?: Partial<ImageItem>) => void;
  updateImage: (id: string, data: Partial<ImageItem>) => void;
  updateImageResult: (id: string, result: string) => void;
  pausePendingImages: (reason: ImageWaitingReason, retryAt: number) => void;
  clearWaitingState: (id: string) => void;
  pruneExpiredTerminalImages: (retentionMs?: number, now?: number) => number;
}

// Helper to create preview URL
const createPreview = (file: File) => URL.createObjectURL(file);

const revokeObjectUrl = (url?: string | null) => {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

const isTerminalStatus = (status: ImageItem["status"]) => TERMINAL_STATUSES.includes(status);

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useImagesStore = create<ImagesState>((set, get) => ({
  images: [],

  setImages: (images) => set({ images }),

  addImages: (files) => {
    const newImages: ImageItem[] = files.map((file) => ({
      id: generateId(),
      file,
      preview: createPreview(file),
      status: "pending" as const,
    }));
    set((state) => ({ images: [...newImages, ...state.images] }));

    // Load dimensions
    newImages.forEach((image) => {
      const loader = new Image();
      loader.onload = () => {
        set((state) => ({
          images: state.images.map((item) =>
            item.id === image.id
              ? { ...item, dimensions: { width: loader.naturalWidth, height: loader.naturalHeight } }
              : item
          ),
        }));
      };
      loader.src = image.preview;
    });
  },

  removeImage: (id) => {
    const item = get().images.find((img) => img.id === id);
    if (item) {
      revokeObjectUrl(item.preview);
      revokeObjectUrl(item.result);
    }
    set((state) => ({ images: state.images.filter((img) => img.id !== id) }));
  },

  clearImages: () => {
    get().images.forEach((img) => {
      revokeObjectUrl(img.preview);
      revokeObjectUrl(img.result);
    });
    set({ images: [] });
  },

  updateImageStatus: (id, status, data) =>
    set((state) => ({
      images: state.images.map((img) => {
        if (img.id !== id) return img;
        if (data && "result" in data && data.result !== img.result) {
          console.debug(`[ImagesStore] updateImageStatus result set for ${id}`, data.result);
          revokeObjectUrl(img.result);
        }
        const terminalAt = isTerminalStatus(status)
          ? data?.terminalAt ?? img.terminalAt ?? Date.now()
          : null;
        const updated = {
          ...img,
          status,
          ...data,
          ...(terminalAt != null ? { terminalAt } : {}),
        };
        return updated;
      }),
    })),

  updateImage: (id, data) =>
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, ...data } : img)),
    })),

  updateImageResult: (id, result) =>
    set((state) => ({
      images: state.images.map((img) => {
        if (img.id !== id) return img;
        if (result !== img.result) {
          console.debug(`[ImagesStore] updateImageResult for ${id}`, result);
          revokeObjectUrl(img.result);
        }
        return {
          ...img,
          result,
          terminalAt: isTerminalStatus(img.status) ? img.terminalAt ?? Date.now() : img.terminalAt,
        };
      }),
    })),

  pausePendingImages: (reason, retryAt) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.status === "pending" || img.status === "uploading"
          ? {
              ...img,
              status: "pending" as const,
              waitingReason: reason,
              creditResetAt: reason === "credits_exhausted" ? retryAt : null,
              queueRetryAt: reason === "queue_full" ? retryAt : null,
            }
          : img
      ),
    })),

  clearWaitingState: (id) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              waitingReason: null,
              creditResetAt: null,
              queueRetryAt: null,
            }
          : img
      ),
    })),

  pruneExpiredTerminalImages: (retentionMs = DEFAULT_TERMINAL_RETENTION_MS, now = Date.now()) => {
    const cutoff = now - retentionMs;
    let removedCount = 0;

    set((state) => {
      const nextImages = state.images.filter((img) => {
        const terminalAt = img.terminalAt ?? null;
        const shouldRemove = isTerminalStatus(img.status) && terminalAt != null && terminalAt <= cutoff;

        if (shouldRemove) {
          revokeObjectUrl(img.preview);
          revokeObjectUrl(img.result);
          removedCount += 1;
          return false;
        }

        return true;
      });

      return { images: nextImages };
    });

    return removedCount;
  },
}));
