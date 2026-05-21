"use client";

import React, { createContext, useContext, useRef, useEffect, useCallback } from "react";
import { submitImage, getJobStatus, getQueueStatus, getJobResult, WorkerApiError } from "@/lib/worker-api";
import { persistImageState, restoreImageState } from "@/lib/image-state-persistence";
import { useImagesStore } from "@/store/images";
import { useCreditsStore } from "@/store/credits";
import { useProcessingStore } from "@/store/processing";
import { ImageItem, ImageWaitingReason } from "@/types/image";
import { useToast } from "@/components/ui/toast";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TERMINAL_RETENTION_MS = 10 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 1000;

const ImageContext = createContext<{
  images: ImageItem[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  updateImageStatus: (id: string, status: ImageItem["status"], data?: Partial<ImageItem>) => void;
  updateImage: (id: string, data: Partial<ImageItem>) => void;
  updateImageResult: (id: string, result: string) => void;
} | null>(null);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const images = useImagesStore((state) => state.images);
  const setImagesStore = useImagesStore((state) => state.setImages);
  const addImagesStore = useImagesStore((state) => state.addImages);
  const removeImageStore = useImagesStore((state) => state.removeImage);
  const clearImagesStore = useImagesStore((state) => state.clearImages);
  const updateImageStatusStore = useImagesStore((state) => state.updateImageStatus);
  const updateImageStore = useImagesStore((state) => state.updateImage);
  const updateImageResultStore = useImagesStore((state) => state.updateImageResult);
  const pausePendingImages = useImagesStore((state) => state.pausePendingImages);
  const clearWaitingState = useImagesStore((state) => state.clearWaitingState);
  const pruneExpiredTerminalImages = useImagesStore((state) => state.pruneExpiredTerminalImages);

  const setCredits = useCreditsStore((state) => state.setCredits);
  const { currentImageId, setSubmitting, clearSubmitting } = useProcessingStore();
  const { addToast } = useToast();
  const processingRef = useRef(false);
  const [retryTick, setRetryTick] = React.useState(0);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const resultFetchAttemptsRef = useRef<Map<string, number>>(new Map());
  const MAX_RESULT_FETCH_RETRIES = 12; // number of polling attempts before giving up
  const [isHydrated, setIsHydrated] = React.useState(false);

  const pausePending = useCallback((reason: ImageWaitingReason, retryInSeconds: number) => {
    pausePendingImages(reason, Date.now() + retryInSeconds * 1000);
  }, [pausePendingImages]);

  const stopPollingForImage = useCallback((imageId: string) => {
    const existingInterval = pollingIntervalsRef.current.get(imageId);
    if (existingInterval) {
      clearInterval(existingInterval);
      pollingIntervalsRef.current.delete(imageId);
    }
  }, []);

  const fetchWorkerResult = useCallback(async (jobId: string) => {
    try {
      return await getJobResult(jobId);
    } catch (workerErr) {
      try {
        const resultResp = await fetch(`/api/result/${jobId}`, { cache: "no-store" });
        if (resultResp.ok) {
          return await resultResp.blob();
        }
      } catch (proxyErr) {
        console.error("Failed to retrieve result from worker and proxy:", workerErr, proxyErr);
      }

      throw workerErr;
    }
  }, []);

  const refreshImageFromWorker = useCallback(async (img: ImageItem) => {
    if (!img.jobId || img.jobId === "direct") {
      return;
    }

    try {
      const status = await getJobStatus(img.jobId);

      const mappedStatus =
        status.status === "running" ||
        status.status === "starting" ||
        status.status === "uploading_result"
          ? "processing"
          : status.status === "queued"
            ? "queued"
            : status.status === "failed" ||
                status.status === "expired" ||
                status.status === "cancelled" ||
                status.status === "error"
              ? "error"
              : status.status;

      updateImageStatusStore(img.id, mappedStatus as ImageItem["status"], {
        progress: status.progress,
        queuePosition: status.status === "queued" ? status.queue_position ?? null : null,
        estimatedWaitSeconds: status.status === "queued" ? status.estimated_wait_seconds ?? null : null,
      });

      if (status.status === "completed") {
        if (!img.result) {
          try {
            const blob = await fetchWorkerResult(img.jobId);
            const url = URL.createObjectURL(blob);
            updateImageStatusStore(img.id, "completed", {
              result: url,
              duration: img.startTime ? Date.now() - img.startTime : undefined,
              progress: 100,
            });
            // Success - clear retry counter and stop polling
            resultFetchAttemptsRef.current.delete(img.id);
            stopPollingForImage(img.id);
          } catch (resultErr) {
            console.error("[ImageContext] Failed to recover completed result:", resultErr);
            const prev = resultFetchAttemptsRef.current.get(img.id) || 0;
            const next = prev + 1;
            resultFetchAttemptsRef.current.set(img.id, next);

            // If we've retried enough times, surface an error and stop polling.
            if (next >= MAX_RESULT_FETCH_RETRIES) {
              console.error(`[ImageContext] Giving up fetching result for ${img.id} after ${next} attempts`);
              updateImageStatusStore(img.id, "error", {
                error: "Failed to fetch processed image",
                progress: 0,
              });
              resultFetchAttemptsRef.current.delete(img.id);
              stopPollingForImage(img.id);

              const store = useProcessingStore.getState();
              if (store.currentImageId === img.id) {
                clearSubmitting();
              }
            }
            // otherwise retain polling so the next interval will retry
          }
        } else {
          // already have a result, nothing more to do
          stopPollingForImage(img.id);
        }
      } else if (
        status.status === "failed" ||
        status.status === "expired" ||
        status.status === "cancelled" ||
        status.status === "error"
      ) {
        updateImageStatusStore(img.id, "error", {
          error: status.error || "Processing failed",
          progress: 0,
        });
        stopPollingForImage(img.id);

        const store = useProcessingStore.getState();
        if (store.currentImageId === img.id) {
          clearSubmitting();
        }
      }

      if (
        status.status === "completed" ||
        status.status === "failed" ||
        status.status === "expired" ||
        status.status === "cancelled" ||
        status.status === "error"
      ) {
        const store = useProcessingStore.getState();
        if (store.currentImageId === img.id) {
          clearSubmitting();
        }
      }
    } catch (err) {
      console.error("Polling error for", img.id, err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("404") || message.toLowerCase().includes("job not found")) {
        updateImageStatusStore(img.id, "error", {
          error: "Job no longer exists on the worker",
          progress: 0,
        });

        stopPollingForImage(img.id);

        const store = useProcessingStore.getState();
        if (store.currentImageId === img.id) {
          clearSubmitting();
        }
      }
    }
  }, [clearSubmitting, fetchWorkerResult, stopPollingForImage, updateImageStatusStore]);

  const syncActiveJobs = useCallback(async () => {
    const activeImages = useImagesStore.getState().images.filter(
      (img) =>
        img.jobId &&
        img.jobId !== "direct" &&
        img.status !== "error" &&
        (img.status !== "completed" || !img.result)
    );

    if (activeImages.length === 0) {
      return;
    }

    await Promise.all(activeImages.map((img) => refreshImageFromWorker(img)));
  }, [refreshImageFromWorker]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    const intervals = pollingIntervalsRef.current;
    return () => {
      intervals.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      intervals.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const restoredImages = await restoreImageState();
        if (cancelled) {
          restoredImages.forEach((image) => {
            URL.revokeObjectURL(image.preview);
            if (image.result) {
              URL.revokeObjectURL(image.result);
            }
          });
          return;
        }

        if (restoredImages.length > 0) {
          setImagesStore(restoredImages);
        }

        pruneExpiredTerminalImages(TERMINAL_RETENTION_MS);

        clearSubmitting();
        setIsHydrated(true);

        if (restoredImages.some((image) => image.jobId && image.jobId !== "direct")) {
          void syncActiveJobs();
        }
      } catch (error) {
        console.warn("[ImageContext] Failed to restore persisted images:", error);
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [clearSubmitting, pruneExpiredTerminalImages, setImagesStore, syncActiveJobs]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const pruneTimer = window.setInterval(() => {
      const removedCount = pruneExpiredTerminalImages(TERMINAL_RETENTION_MS);
      if (removedCount > 0) {
        const store = useProcessingStore.getState();
        const currentImageId = store.currentImageId;
        if (currentImageId && !useImagesStore.getState().images.some((image) => image.id === currentImageId)) {
          clearSubmitting();
        }
      }
    }, PRUNE_INTERVAL_MS);

    const timer = window.setTimeout(() => {
      void persistImageState(images).catch((error) => {
        console.warn("[ImageContext] Failed to persist images:", error);
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(pruneTimer);
    };
  }, [clearSubmitting, images, isHydrated, pruneExpiredTerminalImages]);

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        void syncActiveJobs();
      }
    };

    const handleFocus = () => {
      void syncActiveJobs();
    };

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncActiveJobs]);

  // Older local queue-cap logic could leave images stuck as queue_full. Clear it
  // so available credits can drive submission.
  useEffect(() => {
    images.forEach((img) => {
      if (img.status === "pending" && img.waitingReason === "queue_full") {
        clearWaitingState(img.id);
      }
    });
  }, [images, clearWaitingState]);

  // Re-run the processing effect when a paused pending image is ready to retry.
  useEffect(() => {
    const now = Date.now();
    const nextRetryAt = images.reduce<number | null>((next, img) => {
      if (img.status !== "pending" || !img.waitingReason) {
        return next;
      }

      const retryAt =
        img.waitingReason === "credits_exhausted"
          ? img.creditResetAt
          : null;

      if (!retryAt || retryAt <= now) {
        return next;
      }

      return next == null ? retryAt : Math.min(next, retryAt);
    }, null);

    if (nextRetryAt == null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRetryTick((tick) => tick + 1);
    }, Math.max(250, nextRetryAt - now));

    return () => window.clearTimeout(timer);
  }, [images]);

  // Poll worker status for active jobs (queued/running) until terminal state.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const activeImages = images.filter(
      (img) =>
        img.jobId &&
        img.jobId !== "direct" &&
        img.status !== "completed" &&
        img.status !== "error"
    );

    activeImages.forEach((img) => {
      if (!pollingIntervalsRef.current.has(img.id)) {
        const intervalId = setInterval(() => {
          void refreshImageFromWorker(img);
        }, 500);
        pollingIntervalsRef.current.set(img.id, intervalId);
      }
    });

    // Cleanup intervals for images that are no longer active.
    pollingIntervalsRef.current.forEach((intervalId, imageId) => {
      const img = images.find((i) => i.id === imageId);
      if (!img || !img.jobId || img.jobId === "direct" || img.status === "completed" || img.status === "error") {
        clearInterval(intervalId);
        pollingIntervalsRef.current.delete(imageId);
      }
    });
  }, [images, clearSubmitting, isHydrated, refreshImageFromWorker]);

  // Auto-process images - ONE AT A TIME
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Don't run if already processing
    if (processingRef.current) {
      return;
    }

    // Don't run if another image is being submitted
    if (currentImageId !== null) {
      return;
    }

    // Find first pending image
    const now = Date.now();
    const pendingImage = images.find(
      (img) =>
        img.status === "pending" &&
        (
          !img.waitingReason ||
          (img.waitingReason === "credits_exhausted" && (img.creditResetAt ?? 0) <= now)
        )
    );
    if (!pendingImage) {
      return;
    }

    console.log("[ImageContext] Processing image:", pendingImage.id);
    processingRef.current = true;
    setSubmitting(pendingImage.id);

    // Check queue status and submit
    getQueueStatus()
      .then((status) => {
        // Update credits store
        setCredits(status.remaining, status.reset_in_seconds ?? 3600);

        if (status.remaining === 0) {
          processingRef.current = false;
          clearSubmitting();
          pausePending("credits_exhausted", status.reset_in_seconds ?? 3600);
          console.log("[ImageContext] Paused - credits exhausted");
          return;
        }

        // Update status to uploading
        clearWaitingState(pendingImage.id);
        useImagesStore.getState().updateImageStatus(pendingImage.id, "uploading", { startTime: Date.now() });

        // Submit to server
        return submitImage(pendingImage.file);
      })
      .then((response) => {
        if (!response) return;

        console.log("[ImageContext] Submit response:", response);

        if (Number.isFinite(response.remaining)) {
          setCredits(response.remaining ?? 0, response.reset_in_seconds ?? 3600);
        }

        getQueueStatus()
          .then((status) => {
            setCredits(status.remaining, status.reset_in_seconds ?? 3600);
          })
          .catch((error) => {
            console.warn("[ImageContext] Failed to refresh credits after submit:", error);
          });

        if (response.status === "completed" && response.imageBlob) {
          const url = URL.createObjectURL(response.imageBlob);
          const currentImage = useImagesStore.getState().images.find((img) => img.id === pendingImage.id);
          useImagesStore.getState().updateImageStatus(pendingImage.id, "completed", {
            result: url,
            jobId: "direct",
            duration: currentImage?.startTime ? Date.now() - currentImage.startTime : undefined,
            progress: 100,
          });
        } else {
          // Job was queued on the worker
          useImagesStore.getState().updateImageStatus(pendingImage.id, "queued", {
            jobId: response.job_id,
            waitingReason: null,
            creditResetAt: null,
            queueRetryAt: null,
          });
        }
      })
      .catch((err) => {
        console.error("[ImageContext] Processing failed:", err);
        if (err instanceof WorkerApiError && err.status === 403) {
          const details = err.details as { reset_in_seconds?: number; remaining?: number } | null;
          setCredits(details?.remaining ?? 0, details?.reset_in_seconds ?? 3600);
          pausePending("credits_exhausted", details?.reset_in_seconds ?? 3600);
          return;
        }
        useImagesStore.getState().updateImageStatus(pendingImage.id, "error", {
          error: err.message || "Unknown error",
          progress: 0,
        });
      })
      .finally(() => {
        console.log("[ImageContext] Processing complete");
        processingRef.current = false;
        // Only clear if this image is still the current one
        const store = useProcessingStore.getState();
        if (store.currentImageId === pendingImage.id) {
          clearSubmitting();
        }
      });
  }, [images, currentImageId, retryTick, isHydrated, setCredits, setSubmitting, clearSubmitting, pausePending, clearWaitingState]);

  const addImages = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    }

    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.length > 1
        ? oversizedFiles.slice(0, 3).join(", ") + (oversizedFiles.length > 3 ? ` and ${oversizedFiles.length - 3} more` : "")
        : oversizedFiles[0];
      addToast({
        type: "warning",
        title: "File too large",
        description: `${fileList} exceed ${MAX_FILE_SIZE_MB}MB limit. Please use smaller images.`,
        duration: 5000,
      });
    }

    if (validFiles.length > 0) {
      addImagesStore(validFiles);
    }
  }, [addImagesStore, addToast]);

  const removeImage = useCallback((id: string) => {
    removeImageStore(id);
  }, [removeImageStore]);

  const clearImages = useCallback(() => {
    clearImagesStore();
  }, [clearImagesStore]);

  const updateImageStatus = useCallback((id: string, status: ImageItem["status"], data?: Partial<ImageItem>) => {
    updateImageStatusStore(id, status, data);
  }, [updateImageStatusStore]);

  const updateImage = useCallback((id: string, data: Partial<ImageItem>) => {
    updateImageStore(id, data);
  }, [updateImageStore]);

  const updateImageResult = useCallback((id: string, result: string) => {
    updateImageResultStore(id, result);
  }, [updateImageResultStore]);

  return (
    <ImageContext.Provider
      value={{
        images,
        addImages,
        removeImage,
        clearImages,
        updateImageStatus,
        updateImage,
        updateImageResult,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImages must be used within ImageProvider");
  }
  return context;
}
