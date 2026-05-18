"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useImagesStore } from "@/store/images";
import { useCreditsStore } from "@/store/credits";
import { useToast } from "@/components/ui/toast";
import { AppLayout } from "@/components/app-layout";
import { PreviewDisplay } from "@/components/preview-display";
import { PreviewInfo } from "@/components/preview-info";
import { ThumbnailGallery } from "@/components/thumbnail-gallery";
import { FeedbackSection } from "@/components/feedback-section";
import { EraserTool } from "@/components/eraser-tool";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImageItem } from "@/types/image";

export default function EditorPage() {
  const images = useImagesStore((state) => state.images);
  const addImages = useImagesStore((state) => state.addImages);
  const removeImage = useImagesStore((state) => state.removeImage);
  const updateImageStatus = useImagesStore((state) => state.updateImageStatus);
  const updateImageResult = useImagesStore((state) => state.updateImageResult);
  const remaining = useCreditsStore((state) => state.remaining);
  const creditsLeft = Number.isFinite(remaining) ? remaining : 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEraser, setShowEraser] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const { addToast } = useToast();
  const prevCompletedCount = useRef(0);
  const router = useRouter();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        addImages(files);
      }
      e.target.value = "";
    },
    [addImages]
  );

  // Update selectedId when images change (new images added)
  React.useEffect(() => {
    if (images.length === 0) {
      if (selectedId) {
        setSelectedId(null);
      }
      return;
    }

    const selectedExists = selectedId ? images.some((img) => img.id === selectedId) : false;

    if (!selectedExists) {
      const pendingImage = images.find((img) => img.status === "pending");
      setSelectedId(pendingImage?.id ?? images[0].id);
    }
  }, [images, selectedId]);

  // Track completion and show toast when all done
  useEffect(() => {
    const completedCount = images.filter(
      (img) => img.status === "completed"
    ).length;
    const processingCount = images.filter((img) =>
      ["pending", "uploading", "queued", "running", "processing"].includes(
        img.status
      )
    ).length;

    if (
      completedCount > 0 &&
      processingCount === 0 &&
      prevCompletedCount.current > 0 &&
      completedCount !== prevCompletedCount.current
    ) {
      addToast({
        type: "success",
        title: "All images processed!",
        description: `${completedCount} ${
          completedCount === 1 ? "image" : "images"
        } ready for download.`,
        duration: 5000,
      });
    }
    prevCompletedCount.current = completedCount;
  }, [images, addToast]);

  const handleRemove = useCallback((id: string) => {
    const remaining = images.filter((i: ImageItem) => i.id !== id);
    if (remaining.length > 0 && selectedId === id) {
      const pendingImage = remaining.find((img) => img.status === "pending");
      if (pendingImage) {
        setSelectedId(pendingImage.id);
      } else {
        setSelectedId(remaining[0].id);
      }
    } else if (remaining.length === 0) {
      setSelectedId(null);
    }
    removeImage(id);
  }, [images, selectedId, removeImage]);

  const handleRetry = useCallback((id: string) => {
    setSelectedId(id);
    updateImageStatus(id, "pending", {
      error: undefined,
      result: undefined,
      jobId: undefined,
      progress: 0,
      queuePosition: null,
      estimatedWaitSeconds: null,
      waitingReason: null,
      creditResetAt: null,
      queueRetryAt: null,
      startTime: undefined,
      duration: undefined,
    });
  }, [updateImageStatus]);

  const selectedImage = images.find((img: ImageItem) => img.id === selectedId);

  const handleDropZoneDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      setIsDropActive(true);
    }
  }, []);

  const handleDropZoneDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);
  }, []);

  const handleDropZoneDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDropZoneDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  // No images state - show drag & drop area
  if (images.length === 0) {
    return (
      <AppLayout>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.tif,.tiff,.heif,.heic,.avif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
          onDragEnter={handleDropZoneDragEnter}
          onDragLeave={handleDropZoneDragLeave}
          onDragOver={handleDropZoneDragOver}
          onDrop={handleDropZoneDrop}
        >
          <div className="flex items-center gap-3 mb-8">
            <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Background Remover</h1>
              <p className="text-muted-foreground text-sm">Remove background from images instantly</p>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "premium-dashed flex min-h-[60vh] cursor-pointer flex-col items-center justify-center rounded-[2rem] text-center transition-all",
              isDropActive && "border-lime-300/70 bg-lime-300/10"
            )}
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Drop images here</h2>
            <p className="text-muted-foreground mb-4">or click to browse</p>
            <p className="text-sm text-muted-foreground">Supports PNG, JPG, WebP, TIFF, HEIF/HEIC, AVIF</p>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        onDragEnter={handleDropZoneDragEnter}
        onDragLeave={handleDropZoneDragLeave}
        onDragOver={handleDropZoneDragOver}
        onDrop={handleDropZoneDrop}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Processing</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {images.length} {images.length === 1 ? "image" : "images"} selected
                    <span className="ml-2 text-amber-600 tabular-nums">
                      ({creditsLeft} credits left)
                    </span>
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Add More</span>
              </Button>
            </div>
          </div>

          {/* Main Preview Section - 2 columns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Preview (2 columns) */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedImage && (
                  <SelectedPreview
                    key={selectedImage.id}
                    image={selectedImage}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Right side - Info Panel (1 column) */}
            <div>
              <AnimatePresence mode="wait">
                {selectedImage && (
                  <SelectedInfo
                    key={`info-${selectedImage.id}`}
                    image={selectedImage}
                    onRemove={() => handleRemove(selectedImage.id)}
                    onRetry={() => handleRetry(selectedImage.id)}
                    onOpenEraser={() => setShowEraser(true)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          <div className="space-y-4">
            <ThumbnailGallery
              images={images}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={handleRemove}
            />
          </div>

          {/* Feedback Section */}
          <FeedbackSection />

          {/* Eraser Tool Modal */}
          {showEraser && selectedImage && selectedImage.result && (
            <EraserTool
              processedImage={selectedImage.result}
              originalImage={selectedImage.preview}
              onSave={(dataUrl) => {
                updateImageResult(selectedImage.id, dataUrl);
                setShowEraser(false);
                addToast({ type: "success", title: "Changes saved!", duration: 3000 });
              }}
              onClose={() => setShowEraser(false)}
            />
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}

function SelectedPreview({
  image,
}: {
  image: ImageItem;
}) {
  const isProcessing = [
    "queued",
    "uploading",
    "running",
    "processing",
  ].includes(image.status);
  const isResultFetching = image.status === "completed" && !image.result;

  return (
    <PreviewDisplay
      image={image}
      resultUrl={image.result || null}
      isProcessing={isProcessing}
      isResultFetching={isResultFetching}
    />
  );
}

function SelectedInfo({ image, onRemove, onRetry, onOpenEraser }: { image: ImageItem; onRemove: () => void; onRetry: () => void; onOpenEraser?: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadResult = async () => {
    const url = image.result;
    if (!url || isDownloading) return;
    setIsDownloading(true);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${image.file.name.split(".")[0]}-nobg.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsDownloading(false), 500);
  };

  const isCompleted = image.status === "completed" && !!image.result;
  const isResultFetching = image.status === "completed" && !image.result;
  const isError = image.status === "error" || image.status === "failed";
  const isProcessing = [
    "queued",
    "uploading",
    "running",
    "processing",
  ].includes(image.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="sticky top-24"
    >
      <PreviewInfo
        image={image}
        isProcessing={isProcessing}
        isResultFetching={isResultFetching}
        isCompleted={isCompleted}
        isError={isError}
        onRemove={onRemove}
        onRetry={onRetry}
        onDownload={downloadResult}
        isDownloading={isDownloading}
        liveStatus="unknown"
        onOpenEraser={onOpenEraser}
      />
    </motion.div>
  );
}
