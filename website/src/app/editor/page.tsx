"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImages, ImageItem } from "@/contexts/ImageContext";
import { useToast } from "@/components/ui/toast";
import { AppLayout } from "@/components/app-layout";
import { PreviewDisplay } from "@/components/preview-display";
import { PreviewInfo } from "@/components/preview-info";
import { ThumbnailGallery } from "@/components/thumbnail-gallery";
import { FeedbackSection } from "@/components/feedback-section";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditorPage() {
  const { images, addImages, removeImage } = useImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    if (images.length > 0 && !selectedId) {
      const pendingImage = images.find((img) => img.status === "pending");
      if (pendingImage) {
        setSelectedId(pendingImage.id);
      } else {
        setSelectedId(images[0].id);
      }
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

  const selectedImage = images.find((img: ImageItem) => img.id === selectedId);

  // No images state - redirect to home
  if (images.length === 0) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
          >
            <p className="text-muted-foreground text-lg">No images to process</p>
            <Button onClick={() => router.push("/")} variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="pb-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Processing</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {images.length} {images.length === 1 ? "image" : "images"} selected
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

  return (
    <PreviewDisplay
      image={image}
      resultUrl={image.result || null}
      isProcessing={isProcessing}
    />
  );
}

function SelectedInfo({ image, onRemove }: { image: ImageItem; onRemove: () => void }) {
  const [resultUrl, setResultUrl] = useState<string | null>(image.result || null);
  const [isDownloading, setIsDownloading] = useState(false);
  const jobIdRef = useRef<string | null>(image.jobId || null);

  // Sync result URL when image result changes
  React.useEffect(() => {
    if (image.result && image.result !== resultUrl) {
      setResultUrl(image.result);
    }
    if (image.jobId) {
      jobIdRef.current = image.jobId;
    }
  }, [image.result, image.jobId, resultUrl]);

  const downloadResult = async () => {
    const url = resultUrl || image.result;
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

  const finalResultUrl = resultUrl || image.result || null;
  const isCompleted = image.status === "completed" && !!finalResultUrl;
  const isError = image.status === "error";
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
        isCompleted={isCompleted}
        isError={isError}
        onRemove={onRemove}
        onRetry={() => {}}
        onDownload={downloadResult}
        isDownloading={isDownloading}
        liveStatus="unknown"
      />
    </motion.div>
  );
}
