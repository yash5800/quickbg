"use client";

import React, { createContext, useContext, useState } from "react";

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

  const addImages = (files: File[]) => {
    const newImages: ImageItem[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
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
  };

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
