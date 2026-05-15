"use client";

import React, { createContext, useContext, useRef, useEffect, useCallback } from "react";
import { submitImage, getJobStatus, getQueueStatus, getJobResult, WorkerApiError } from "@/lib/worker-api";
import { useImagesStore } from "@/store/images";
import { useCreditsStore } from "@/store/credits";
import { useProcessingStore } from "@/store/processing";
import { ImageItem, ImageWaitingReason } from "@/types/image";
import { useToast } from "@/components/ui/toast";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  const addImagesStore = useImagesStore((state) => state.addImages);
  const removeImageStore = useImagesStore((state) => state.removeImage);
  const clearImagesStore = useImagesStore((state) => state.clearImages);
  const updateImageStatusStore = useImagesStore((state) => state.updateImageStatus);
  const updateImageStore = useImagesStore((state) => state.updateImage);
  const updateImageResultStore = useImagesStore((state) => state.updateImageResult);
  const pausePendingImages = useImagesStore((state) => state.pausePendingImages);
  const clearWaitingState = useImagesStore((state) => state.clearWaitingState);

  const setCredits = useCreditsStore((state) => state.setCredits);
  const consumeCredit = useCreditsStore((state) => state.consumeCredit);
  const { currentImageId, setSubmitting, clearSubmitting } = useProcessingStore();
  const { addToast } = useToast();
  const processingRef = useRef(false);
  const [retryTick, setRetryTick] = React.useState(0);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const pausePending = useCallback((reason: ImageWaitingReason, retryInSeconds: number) => {
    pausePendingImages(reason, Date.now() + retryInSeconds * 1000);
  }, [pausePendingImages]);

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
    const activeImages = images.filter(
      (img) =>
        img.jobId &&
        img.jobId !== "direct" &&
        img.status !== "completed" &&
        img.status !== "error"
    );

    activeImages.forEach((img) => {
      if (!pollingIntervalsRef.current.has(img.id)) {
        const intervalId = setInterval(async () => {
          try {
            const status = await getJobStatus(img.jobId!);

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

            useImagesStore.getState().updateImageStatus(img.id, mappedStatus as ImageItem["status"], {
              progress: status.progress,
              queuePosition: status.status === "queued" ? status.queue_position ?? null : null,
              estimatedWaitSeconds: status.status === "queued" ? status.estimated_wait_seconds ?? null : null,
            });

            if (status.status === "completed") {
              // Try to fetch the result directly from the worker API in the browser.
              // This avoids an extra server relay and ensures the object URL is
              // created client-side as soon as the worker has the blob.
              try {
                const blob = await getJobResult(img.jobId!);
                const url = URL.createObjectURL(blob);
                useImagesStore.getState().updateImageStatus(img.id, "completed", {
                  result: url,
                  duration: img.startTime ? Date.now() - img.startTime : undefined,
                  progress: 100,
                });
              } catch (workerErr) {
                // If direct worker fetch fails (CORS, network, or worker URL not configured),
                // fall back to the server-side proxy route.
                try {
                  const resultResp = await fetch(`/api/result/${img.jobId}`, { cache: "no-store" });
                  if (resultResp.ok) {
                    const blob = await resultResp.blob();
                    const url = URL.createObjectURL(blob);
                    useImagesStore.getState().updateImageStatus(img.id, "completed", {
                      result: url,
                      duration: img.startTime ? Date.now() - img.startTime : undefined,
                      progress: 100,
                    });
                  } else {
                    console.warn("Result proxy returned non-ok status", resultResp.status);
                  }
                } catch (proxyErr) {
                  console.error("Failed to retrieve result from worker and proxy:", workerErr, proxyErr);
                }
              } finally {
                const existingInterval = pollingIntervalsRef.current.get(img.id);
                if (existingInterval) {
                  clearInterval(existingInterval);
                  pollingIntervalsRef.current.delete(img.id);
                }
              }
            } else if (
              status.status === "failed" ||
              status.status === "expired" ||
              status.status === "cancelled" ||
              status.status === "error"
            ) {
              useImagesStore.getState().updateImageStatus(img.id, "error", {
                error: status.error || "Processing failed",
                progress: 0,
              });
              const existingInterval = pollingIntervalsRef.current.get(img.id);
              if (existingInterval) {
                clearInterval(existingInterval);
                pollingIntervalsRef.current.delete(img.id);
              }
            }

            // Clear submitting state when job completes or fails
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
              useImagesStore.getState().updateImageStatus(img.id, "error", {
                error: "Job no longer exists on the worker",
                progress: 0,
              });

              const existingInterval = pollingIntervalsRef.current.get(img.id);
              if (existingInterval) {
                clearInterval(existingInterval);
                pollingIntervalsRef.current.delete(img.id);
              }

              const store = useProcessingStore.getState();
              if (store.currentImageId === img.id) {
                clearSubmitting();
              }
            }
          }
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
  }, [images, clearSubmitting]);

  // Auto-process images - ONE AT A TIME
  useEffect(() => {
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
        consumeCredit();

        // Submit to server
        return submitImage(pendingImage.file);
      })
      .then((response) => {
        if (!response) return;

        console.log("[ImageContext] Submit response:", response);

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
  }, [images, currentImageId, retryTick, setCredits, consumeCredit, setSubmitting, clearSubmitting, pausePending, clearWaitingState]);

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
