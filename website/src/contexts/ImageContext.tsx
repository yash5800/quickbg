"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { submitImage, getJobStatus, JobQueuedResponse, getQueueStatus } from "@/lib/worker-api";

export interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "queued" | "processing" | "completed" | "error";
  result?: string;
  error?: string;
  startTime?: number;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  jobId?: string; // Worker API job_id
  progress?: number; // 0-100
  queuePosition?: number | null;
  estimatedWaitSeconds?: number | null;
  waitingReason?: "credits_exhausted" | null;
  creditResetAt?: number | null; // timestamp when credits reset
}

interface ImageContextType {
  images: ImageItem[];
  setImages: (images: ImageItem[]) => void;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  updateImageStatus: (id: string, status: ImageItem["status"], data?: Partial<ImageItem>) => void;
  updateImage: (id: string, data: Partial<ImageItem>) => void;
  updateImageResult: (id: string, result: string) => void;
  creditsInfo: { remaining: number; resetIn: number } | null;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const addCountRef = useRef(0);
  const recentFileKeysRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const toastAddedRef = useRef(false);
  const [globalCredits, setGlobalCredits] = useState<{ remaining: number; resetIn: number } | null>(null);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      pollingIntervalsRef.current.clear();
    };
  }, []);

  // Update global credits state and check for exhausted credits
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const status = await getQueueStatus();
        setGlobalCredits({ remaining: status.remaining, resetIn: status.reset_in_seconds ?? 3600 });

        // Only update creditResetAt if NOT already set (set once when credits hit 0)
        if (status.remaining === 0) {
          setImages((prev) => {
            // Check if any pending image needs creditResetAt set
            const needsReset = prev.some(img =>
              img.status === "pending" &&
              img.waitingReason === "credits_exhausted" &&
              img.creditResetAt == null
            );

            if (!needsReset) return prev;

            const resetAt = Date.now() + (status.reset_in_seconds ?? 3600) * 1000;
            return prev.map((img) =>
              img.status === "pending" && img.creditResetAt == null
                ? {
                    ...img,
                    waitingReason: "credits_exhausted",
                    creditResetAt: resetAt,
                  }
                : img
            );
          });
          toastAddedRef.current = true;
        } else if (status.remaining > 0) {
          toastAddedRef.current = false;
        }
      } catch (err) {
        console.error("Failed to fetch queue status:", err);
      }
    };

    checkCredits();
    const interval = setInterval(checkCredits, 10000);
    return () => clearInterval(interval);
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
        // Start polling for this image
        const intervalId = setInterval(async () => {
          try {
            const status = await getJobStatus(img.jobId!);

            const mappedStatus =
              status.status === "running"
                ? "processing"
                : status.status === "queued"
                ? "queued"
                : status.status;

            setImages((prev) =>
              prev.map((item) =>
                item.id === img.id
                  ? {
                      ...item,
                      status:
                        mappedStatus === "completed"
                          ? "completed"
                          : mappedStatus === "failed"
                          ? "error"
                          : mappedStatus,
                      progress: status.progress,
                      queuePosition:
                        status.status === "queued" ? status.queue_position ?? null : null,
                      estimatedWaitSeconds:
                        status.status === "queued" ? status.estimated_wait_seconds ?? null : null,
                    }
                  : item
              )
            );

            if (status.status === "completed") {
              // Fetch result and update status
              const resultResp = await fetch(`/api/result/${img.jobId}`, { cache: "no-store" });
              if (resultResp.ok) {
                const blob = await resultResp.blob();
                const url = URL.createObjectURL(blob);
                setImages((prev) =>
                  prev.map((item) =>
                    item.id === img.id
                      ? {
                          ...item,
                          status: "completed",
                          result: url,
                          duration: item.startTime ? Date.now() - item.startTime : undefined,
                        }
                      : item
                  )
                );
                // Stop polling
                const existingInterval = pollingIntervalsRef.current.get(img.id);
                if (existingInterval) {
                  clearInterval(existingInterval);
                  pollingIntervalsRef.current.delete(img.id);
                }
              }
            } else if (status.status === "failed") {
              setImages((prev) =>
                prev.map((item) =>
                  item.id === img.id
                    ? { ...item, status: "error", error: status.error || "Processing failed" }
                    : item
                )
              );
              // Stop polling
              const existingInterval = pollingIntervalsRef.current.get(img.id);
              if (existingInterval) {
                clearInterval(existingInterval);
                pollingIntervalsRef.current.delete(img.id);
              }
            }
          } catch (err) {
            console.error("Polling error for", img.id, err);
          }
        }, 2000);
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
  }, [images]);

  // Auto-process images when:
  // 1. A new image is added and is in "pending" state
  // 2. The current processing job completes
  useEffect(() => {
    // Skip if already processing
    if (processingRef.current) {
      console.log("[ImageContext] Skipping - already processing");
      return;
    }

    // Find the first pending image
    const pendingImage = images.find((img) => img.status === "pending");
    if (!pendingImage) {
      console.log("[ImageContext] No pending images found");
      return;
    }

    console.log("[ImageContext] Processing image:", pendingImage.id);
    processingRef.current = true;

    // Check credits AND queue status before submitting
    getQueueStatus()
      .then((status) => {
        console.log("[ImageContext] Queue status:", status);

        // If credits are exhausted OR queue is too full, pause
        const maxQueuedJobs = 3;
        if (status.remaining === 0 || status.queue_length >= maxQueuedJobs) {
          processingRef.current = false;
          setImages((prev) => {
            const resetAt = Date.now() + (status.reset_in_seconds ?? 3600) * 1000;
            return prev.map((img) =>
              img.status === "pending"
                ? { ...img, waitingReason: "credits_exhausted", creditResetAt: resetAt }
                : img
            );
          });
          console.log("[ImageContext] Paused - remaining:", status.remaining, "queue:", status.queue_length);
          return;
        }
        return submitImage(pendingImage.file);
      })
      .then((response) => {
        if (!response) return; // Paused
        console.log("[ImageContext] Submit response:", response);

        const startTime = Date.now();
        if (response.status === "completed" && response.imageBlob) {
          const url = URL.createObjectURL(response.imageBlob);
          setImages((prev) =>
            prev.map((img) =>
              img.id === pendingImage.id
                ? { ...img, status: "completed", result: url, jobId: "direct", duration: Date.now() - startTime }
                : img
            )
          );
        } else {
          setImages((prev) =>
            prev.map((img) =>
              img.id === pendingImage.id
                ? { ...img, status: "queued", jobId: response.job_id }
                : img
            )
          );
        }
      })
      .catch((err) => {
        console.error("[ImageContext] Processing failed:", err);
        setImages((prev) =>
          prev.map((img) =>
            img.id === pendingImage.id
              ? { ...img, status: "error", error: err.message || "Unknown error" }
              : img
          )
        );
      })
      .finally(() => {
        console.log("[ImageContext] Processing complete, resetting flag");
        processingRef.current = false;
      });
  }, [images]);

  const addImages = useCallback((files: File[]) => {
    // Create unique keys for deduplication (name + size + lastModified)
    const fileKeys = files.map(f => `${f.name}-${f.size}-${f.lastModified}`);

    // Filter out files that were recently added (within last 2 seconds)
    const uniqueFiles: File[] = [];
    const newFileKeys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const key = fileKeys[i];
      if (!recentFileKeysRef.current.has(key)) {
        uniqueFiles.push(files[i]);
        newFileKeys.push(key);
      }
    }

    // Add new keys to recent set with 2 second expiry
    newFileKeys.forEach(key => {
      recentFileKeysRef.current.add(key);
      setTimeout(() => {
        recentFileKeysRef.current.delete(key);
      }, 2000);
    });

    if (uniqueFiles.length === 0) {
      console.log("[ImageContext] All files were recently added, skipping duplicates");
      return;
    }

    console.log(`[ImageContext] Adding ${uniqueFiles.length} unique files (filtered ${files.length - uniqueFiles.length} duplicates)`);

    const batchId = ++addCountRef.current;
    const newImages: ImageItem[] = uniqueFiles.map((file) => ({
      id: `${batchId}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setImages((prev) => [...newImages, ...prev]);

    newImages.forEach((image) => {
      const loader = new window.Image();
      loader.onload = () => {
        const width = loader.naturalWidth;
        const height = loader.naturalHeight;

        setImages((current) =>
          current.map((item) =>
            item.id === image.id
              ? { ...item, dimensions: { width, height } }
              : item
          )
        );
      };
      loader.src = image.preview;
    });
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((image) => image.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }

      return prev.filter((image) => image.id !== id);
    });
  };

  const clearImages = () => {
    setImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.preview));
      return [];
    });
  };

  const updateImageStatus = (id: string, status: ImageItem["status"], data?: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, ...data } : item
      )
    );
  };

  const updateImage = (id: string, data: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...data } : item
      )
    );
  };

  // Update image result directly (used by eraser tool)
  const updateImageResult = useCallback((id: string, result: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, result } : img
      )
    );
  }, []);

  return (
    <ImageContext.Provider
      value={{
        images,
        setImages,
        addImages,
        removeImage,
        clearImages,
        updateImageStatus,
        updateImage,
        updateImageResult,
        creditsInfo: globalCredits,
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
