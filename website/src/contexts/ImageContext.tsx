"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { submitImage, getJobStatus, JobQueuedResponse, getQueueStatus } from "@/lib/worker-api";

function formatResetTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

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
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const addCountRef = useRef(0);
  const recentFileKeysRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);
  const processingQueueRef = useRef<string[]>([]);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const toastAddedRef = useRef(false);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      pollingIntervalsRef.current.clear();
    };
  }, []);

  const [creditToast, setCreditToast] = useState<{ id: string; resetInSeconds: number; endTime: number } | null>(null);
  const [creditCountdown, setCreditCountdown] = useState<number>(0);

  // Live countdown ticker for credit warning
  useEffect(() => {
    if (!creditToast) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((creditToast.endTime - Date.now()) / 1000));
      setCreditCountdown(remaining);

      if (remaining <= 0) {
        setCreditToast(null);
        toastAddedRef.current = false;
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [creditToast]);
  // Only show warning when:
  // 1. Credits are 0 AND
  // 2. All images are either completed or errored (no processing in progress)
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const status = await getQueueStatus();

        const pendingOrProcessing = images.filter((img) =>
          ["pending", "uploading", "queued", "running", "processing"].includes(img.status)
        );

        const allDone = pendingOrProcessing.length === 0 && images.length > 0;

        if (status.remaining === 0 && allDone && !toastAddedRef.current) {
          toastAddedRef.current = true;
          const id = Math.random().toString(36).substring(2, 9);
          setCreditToast({ id, resetInSeconds: status.reset_in_seconds ?? 3600, endTime: Date.now() + (status.reset_in_seconds ?? 3600) * 1000 });
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

  // Poll job status for queued images
  useEffect(() => {
    const queuedImages = images.filter((img) => img.status === "queued" && img.jobId && img.jobId !== "direct");

    queuedImages.forEach((img) => {
      if (!pollingIntervalsRef.current.has(img.id)) {
        // Start polling for this image
        const intervalId = setInterval(async () => {
          try {
            const status = await getJobStatus(img.jobId!);
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

    // Cleanup intervals for images no longer queued
    pollingIntervalsRef.current.forEach((intervalId, imageId) => {
      const img = images.find((i) => i.id === imageId);
      if (!img || img.status !== "queued" || !img.jobId || img.jobId === "direct") {
        clearInterval(intervalId);
        pollingIntervalsRef.current.delete(imageId);
      }
    });
  }, [images]);

  // Auto-process images when:
  // 1. A new image is added and is in "pending" state
  // 2. The current processing job completes
  useEffect(() => {
    const processNext = async () => {
      // Find the first pending image
      const pendingImage = images.find((img) => img.status === "pending");
      if (!pendingImage) return;

      // Check credits before submitting
      try {
        const status = await getQueueStatus();
        if (status.remaining === 0) {
          // Credits exhausted, don't submit - will be retried after credits reset
          console.log("[ImageContext] Credits exhausted, pausing processing");
          return;
        }
      } catch {
        // If we can't check status, continue anyway
      }

      // If this image was just added, add it to the processing queue
      if (!processingQueueRef.current.includes(pendingImage.id)) {
        processingQueueRef.current.push(pendingImage.id);
      }

      // If this image is at the front of the queue and not already processing
      if (
        processingQueueRef.current[0] === pendingImage.id &&
        !processingRef.current
      ) {
        processingRef.current = true;

        const startTime = Date.now();
        setImages((prev) =>
          prev.map((img) =>
            img.id === pendingImage.id
              ? { ...img, status: "uploading", startTime }
              : img
          )
        );

        try {
          const response = (await submitImage(pendingImage.file)) as JobQueuedResponse;

          setImages((prev) => {
            if (response.status === "completed" && response.imageBlob) {
              const url = URL.createObjectURL(response.imageBlob);
              return prev.map((img) =>
                img.id === pendingImage.id
                  ? {
                      ...img,
                      status: "completed",
                      result: url,
                      jobId: "direct",
                      duration: Date.now() - startTime,
                    }
                  : img
              );
            }
            return prev.map((img) =>
              img.id === pendingImage.id
                ? { ...img, status: "queued", jobId: response.job_id }
                : img
            );
          });
        } catch (err) {
          console.error("Processing failed:", err);
          setImages((prev) =>
            prev.map((img) =>
              img.id === pendingImage.id
                ? {
                    ...img,
                    status: "error",
                    error: err instanceof Error ? err.message : "Unknown error",
                  }
                : img
            )
          );
        } finally {
          processingRef.current = false;
          processingQueueRef.current.shift();
        }
      }
    };

    processNext();
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
      }}
    >
      {children}
      {creditToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]">
          <div className="px-4 py-3 rounded-lg bg-destructive/90 text-destructive-foreground border border-destructive/50 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-semibold text-center">Credits exhausted</p>
            <p className="text-xs text-center mt-0.5 opacity-90 font-mono tabular-nums">
              Resets in {formatResetTime(creditCountdown)}
            </p>
          </div>
        </div>
      )}
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
