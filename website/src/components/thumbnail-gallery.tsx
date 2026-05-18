"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageItem } from "@/types/image";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

interface ThumbnailGalleryProps {
  images: ImageItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ThumbnailGallery({
  images,
  selectedId,
  onSelect,
  onRemove,
}: ThumbnailGalleryProps) {
  if (images.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Uploaded Images ({images.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((image) => (
          <ThumbnailItem
            key={image.id}
            image={image}
            isSelected={image.id === selectedId}
            onSelect={() => onSelect(image.id)}
            onRemove={() => onRemove(image.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ThumbnailItem({
  image,
  isSelected,
  onSelect,
  onRemove,
}: {
  image: ImageItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const isCompleted = image.status === "completed" && !!image.result;
  const isFetchingResult = image.status === "completed" && !image.result;
  const isError = image.status === "error" || image.status === "failed";
  const isProcessing = [
    "queued",
    "uploading",
    "running",
    "processing",
  ].includes(image.status) || isFetchingResult;
  const progress = getThumbnailProgress(image, isFetchingResult);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      <button
        onClick={onSelect}
        className={cn(
          "relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200",
          "hover:border-primary/50 hover:shadow-md",
          isSelected
            ? "border-primary ring-2 ring-primary/30 shadow-lg"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover"
        />

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            >
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-sky-300/30 to-transparent"
                animate={{ y: ["-100%", "340%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-x-2 bottom-2">
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-white/80">
                  <span>{image.status === "queued" ? "Queued" : isFetchingResult ? "Fetching" : "Processing"}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-300 to-lime-300"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 110, damping: 20 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* Status Badge */}
        <div className="absolute top-1 right-1 z-10">
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-500 rounded-full p-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </motion.div>
          )}
          {isError && (
            <div className="bg-red-500 rounded-full p-1">
              <AlertCircle className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          {isProcessing && (
            <div className="bg-blue-500 rounded-full p-1">
              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
            </div>
          )}
        </div>
      </button>

      {/* Remove button on hover */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-1 transition-opacity duration-200 hover:bg-destructive/90 shadow-lg"
      >
        <X className="h-3.5 w-3.5" />
      </motion.button>

      {/* File name tooltip */}
      <p className="text-xs text-muted-foreground mt-1 truncate group-hover:text-white transition-colors">
        {image.file.name.substring(0, 15)}
        {image.file.name.length > 15 ? "..." : ""}
      </p>
    </motion.div>
  );
}

function getThumbnailProgress(image: ImageItem, isFetchingResult: boolean): number {
  if (isFetchingResult) return 96;
  if (image.status === "completed") return 100;
  if (image.status === "error" || image.status === "failed") return 0;
  if (typeof image.progress === "number") return Math.max(4, Math.min(98, image.progress));

  const fallback: Record<ImageItem["status"], number> = {
    pending: 8,
    uploading: 24,
    queued: 42,
    running: 68,
    processing: 72,
    completed: 100,
    failed: 0,
    error: 0,
  };

  return fallback[image.status] ?? 12;
}
