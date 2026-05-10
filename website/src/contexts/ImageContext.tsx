"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { submitImage, getJobStatus, JobQueuedResponse } from "@/lib/worker-api";

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
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const addCountRef = useRef(0);
  const recentFileKeysRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);
  const processingQueueRef = useRef<string[]>([]);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      pollingIntervalsRef.current.clear();
    };
  }, []);

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
            } else if (status.status === "failed" || status.status === "error") {
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
