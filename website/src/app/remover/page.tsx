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
import { EraserTool } from "@/components/eraser-tool";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImageItem } from "@/types/image";
import { useProcessingCompleteNotification } from "@/hooks/use-processing-complete-notification";
import { useLocale } from "@/contexts/LocaleContext";
import { ToolFaq, ToolExtraContent } from "@/components/tool-faq";

export default function EditorPage() {
  const { t } = useLocale();
  const images = useImagesStore((state) => state.images);
  const addImages = useImagesStore((state) => state.addImages);
  const removeImage = useImagesStore((state) => state.removeImage);
  const updateImageStatus = useImagesStore((state) => state.updateImageStatus);
  const updateImageResult = useImagesStore((state) => state.updateImageResult);
  const remaining = useCreditsStore((state) => state.remaining);
  const isCreditsInitialized = useCreditsStore((state) => state.isInitialized);
  const creditsLeft = Number.isFinite(remaining) ? remaining : 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEraser, setShowEraser] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const { addToast } = useToast();
  const prevCompletedCount = useRef(0);
  const prevImagesLength = useRef(0);
  const router = useRouter();
  useProcessingCompleteNotification(images);

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
      prevImagesLength.current = 0;
      return;
    }

    const selectedExists = selectedId ? images.some((img) => img.id === selectedId) : false;
    const imagesGrew = images.length > prevImagesLength.current;

    if (imagesGrew) {
      const pendingImage = images.find((img) => img.status === "pending");
      setSelectedId(pendingImage?.id ?? images[0].id);
    } else if (!selectedExists) {
      const pendingImage = images.find((img) => img.status === "pending");
      setSelectedId(pendingImage?.id ?? images[0].id);
    }

    prevImagesLength.current = images.length;
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
  const selectByOffset = useCallback((offset: number) => {
    if (images.length === 0) return;
    const currentIndex = Math.max(0, images.findIndex((img) => img.id === selectedId));
    const nextIndex = Math.min(images.length - 1, Math.max(0, currentIndex + offset));
    setSelectedId(images[nextIndex]?.id ?? images[0].id);
  }, [images, selectedId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showEraser) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const current = useImagesStore.getState().images.find((img) => img.id === selectedId);
        if (current?.result) {
          const a = document.createElement("a");
          a.href = current.result;
          a.download = `${current.file.name.split(".")[0]}-nobg.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
      if (event.key === "ArrowLeft") {
        selectByOffset(-1);
      }
      if (event.key === "ArrowRight") {
        selectByOffset(1);
      }
      if (event.key === "Escape") {
        setShowEraser(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectByOffset, selectedId, showEraser]);

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
          className="remover-shell mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
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
              <h1 className="text-2xl font-bold">{t("common.removeBg")}</h1>
              <p className="text-muted-foreground text-sm">{t("home.tools.removeBgDesc")}</p>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "premium-dashed flex min-h-[60vh] cursor-pointer flex-col items-center justify-center rounded-[2rem] text-center transition-all",
              isDropActive && "border-secondary/70 bg-secondary/10"
            )}
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">{t("home.dropTitle")}</h2>
            <p className="text-muted-foreground mb-4">{t("home.dropDesc")}</p>
          </motion.div>
        </div>

        <section className="mx-auto mt-10 w-full max-w-5xl rounded-xl border border-border/70 bg-background/55 p-5 backdrop-blur">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("remover.guide.heading")}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal text-foreground">{t("tools.howToUse.remover")}</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">1</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step1Title")}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step1Desc")}</p>
            </div>
            <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">2</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step2Title")}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step2Desc")}</p>
            </div>
            <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">3</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step3Title")}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step3Desc")}</p>
            </div>
            <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">4</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step4Title")}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step4Desc")}</p>
            </div>
          </div>
        </section>

        <ToolFaq toolKey="remover" variant="light" />
        <ToolExtraContent toolKey="remover" variant="light" />
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
        className="remover-shell mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1500px] flex-col px-3 py-4 sm:px-5 lg:px-6"
        onDragEnter={handleDropZoneDragEnter}
        onDragLeave={handleDropZoneDragLeave}
        onDragOver={handleDropZoneDragOver}
        onDrop={handleDropZoneDrop}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          {/* Header */}
          <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{t("nav.remover")}</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {images.length} {images.length === 1 ? "image" : "images"} selected
                    <span className="ml-2 text-amber-600 tabular-nums">
                      ({isCreditsInitialized ? creditsLeft : "\u2026"} credits left)
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
                <span className="hidden sm:inline">{t("home.uploadImage")}</span>
              </Button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
            <div className="flex min-h-0 flex-col gap-3">
              <div
                className="min-h-0 flex-1"
                onTouchStart={(event) => {
                  const touch = event.changedTouches[0];
                  if (touch) {
                    (event.currentTarget as HTMLDivElement).dataset.touchStartX = String(touch.clientX);
                  }
                }}
                onTouchEnd={(event) => {
                  const startX = Number((event.currentTarget as HTMLDivElement).dataset.touchStartX || 0);
                  const touch = event.changedTouches[0];
                  if (!touch || !startX) return;
                  const delta = touch.clientX - startX;
                  if (Math.abs(delta) > 60) {
                    selectByOffset(delta > 0 ? -1 : 1);
                  }
                }}
              >
                <AnimatePresence>
                  {selectedImage && (
                    <SelectedPreview
                      key={selectedImage.id}
                      image={selectedImage}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/55 p-3 backdrop-blur">
                <ThumbnailGallery
                  images={images}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={handleRemove}
                  layout="strip"
                />
              </div>
            </div>

            <aside className="min-h-0">
              <div className="xl:space-y-4">
                <AnimatePresence>
                  {selectedImage && (
                    <SelectedInfo
                      key={`info-${selectedImage.id}`}
                      image={selectedImage}
                      onRemove={() => handleRemove(selectedImage.id)}
                      onRetry={() => handleRetry(selectedImage.id)}
                      onOpenEraser={() => setShowEraser(true)}
                      onUpdateResult={(dataUrl) => updateImageResult(selectedImage.id, dataUrl)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>

          
          <section className="mx-auto mt-6 w-full max-w-5xl rounded-xl border border-border/70 bg-background/55 p-5 backdrop-blur">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("remover.guide.heading")}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-normal text-foreground">{t("tools.howToUse.remover")}</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">1</span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step1Title")}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step1Desc")}</p>
              </div>
              <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">2</span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step2Title")}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step2Desc")}</p>
              </div>
              <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">3</span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step3Title")}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step3Desc")}</p>
              </div>
              <div className="relative rounded-xl border border-border/70 bg-background/40 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">4</span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{t("remover.guide.step4Title")}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{t("remover.guide.step4Desc")}</p>
              </div>
            </div>
          </section>

          <ToolFaq toolKey="remover" variant="light" />
          <ToolExtraContent toolKey="remover" variant="light" />

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

function SelectedInfo({
  image,
  onRemove,
  onRetry,
  onOpenEraser,
  onUpdateResult,
}: {
  image: ImageItem;
  onRemove: () => void;
  onRetry: () => void;
  onOpenEraser?: () => void;
  onUpdateResult: (dataUrl: string) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToast } = useToast();

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
      className="xl:sticky xl:top-20 xl:max-h-[calc(100dvh-5.75rem)] xl:overflow-y-auto xl:pr-1"
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
        onCopy={async () => {
          if (!image.result) return;
          try {
            const response = await fetch(image.result);
            const sourceBlob = await response.blob();
            const blob = sourceBlob.type === "image/png" ? sourceBlob : new Blob([sourceBlob], { type: "image/png" });
            if (!navigator.clipboard || !("ClipboardItem" in window)) {
              throw new Error("Clipboard image copy is not supported in this browser");
            }
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            addToast({ type: "success", title: "Copied image", duration: 2500 });
          } catch (error) {
            addToast({
              type: "error",
              title: "Copy failed",
              description: error instanceof Error ? error.message : "Your browser blocked image clipboard access.",
              duration: 3500,
            });
          }
        }}
        onUpdateResult={onUpdateResult}
        isDownloading={isDownloading}
        liveStatus="unknown"
        onOpenEraser={onOpenEraser}
      />
    </motion.div>
  );
}
