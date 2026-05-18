"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "@/types/image";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Loader2, Sparkles, UploadCloud } from "lucide-react";

const ComparisonSlider = dynamic(
  () => import("@/components/comparison-slider").then((mod) => mod.ComparisonSlider),
  { ssr: false }
);

interface PreviewDisplayProps {
  image: ImageItem;
  resultUrl: string | null;
  isProcessing: boolean;
  isResultFetching: boolean;
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getDisplayProgress(image: ImageItem, isResultFetching: boolean): number {
  if (isResultFetching) return 96;
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

function getStatusCopy(image: ImageItem, isResultFetching: boolean) {
  if (isResultFetching) {
    return {
      title: "Preparing final preview",
      description: "The worker finished. Fetching the transparent PNG now.",
      icon: Sparkles,
    };
  }

  if (image.status === "uploading") {
    return {
      title: "Uploading image",
      description: "Sending your file to the worker without changing quality.",
      icon: UploadCloud,
    };
  }

  if (image.status === "queued") {
    return {
      title: image.queuePosition != null && image.queuePosition > 0 ? `Queue position #${image.queuePosition}` : "Waiting in queue",
      description: image.estimatedWaitSeconds ? `Estimated wait: ${formatWait(image.estimatedWaitSeconds)}` : "Your image will start as soon as capacity opens.",
      icon: Clock,
    };
  }

  return {
    title: "Removing background",
    description: "Detecting the subject edges and creating a transparent cutout.",
    icon: Loader2,
  };
}

function ProcessingOverlay({ image, isResultFetching }: { image: ImageItem; isResultFetching: boolean }) {
  const progress = getDisplayProgress(image, isResultFetching);
  const statusCopy = getStatusCopy(image, isResultFetching);
  const StatusIcon = statusCopy.icon;
  const steps = [
    { label: "Upload", done: progress >= 24 },
    { label: "Queue", done: progress >= 42 },
    { label: "Mask", done: progress >= 72 },
    { label: "Export", done: progress >= 96 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 overflow-hidden bg-gradient-to-t from-black/72 via-black/48 to-black/32"
    >
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-300/18 to-transparent"
        animate={{ y: ["-100%", "560%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.96, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 12 }}
          className="premium-surface w-full max-w-md rounded-[1.6rem] p-5 text-white"
        >
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-2xl border border-sky-300/40"
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
              <StatusIcon className={image.status === "queued" ? "h-6 w-6 text-amber-300" : "h-6 w-6 text-sky-300"} />
            </div>

            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={statusCopy.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-lg font-semibold">{statusCopy.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/58">{statusCopy.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-white/50">
              <span>Progress</span>
              <motion.span key={progress} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums">
                {Math.round(progress)}%
              </motion.span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-lime-300"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {steps.map((step, index) => (
              <motion.div
                key={step.label}
                initial={false}
                animate={{
                  borderColor: step.done ? "rgba(190,242,100,0.45)" : "rgba(255,255,255,0.1)",
                  backgroundColor: step.done ? "rgba(190,242,100,0.1)" : "rgba(255,255,255,0.035)",
                }}
                transition={{ delay: index * 0.04 }}
                className="rounded-xl border px-2 py-2 text-center text-[11px] font-medium text-white/70"
              >
                <div className="mx-auto mb-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/25">
                  {step.done ? <CheckCircle2 className="h-3 w-3 text-lime-300" /> : <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}
                </div>
                {step.label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function PreviewDisplay({
  image,
  resultUrl,
  isProcessing,
  isResultFetching,
}: PreviewDisplayProps) {
  const isCompleted = !!resultUrl;
  const showLoadingOverlay = isProcessing || isResultFetching;

  React.useEffect(() => {
    console.debug(
      `[PreviewDisplay] image=${image.id} resultUrl=${resultUrl} isCompleted=${isCompleted} isResultFetching=${isResultFetching}`
    );
  }, [image.id, resultUrl, isCompleted, isResultFetching]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden premium-surface">
        <div
          className={
            isCompleted
              ? "relative w-full aspect-video sm:aspect-square lg:aspect-auto lg:h-[500px] bg-black/20 flex items-center justify-center"
              : "relative w-full max-h-[70vh] bg-black/20 flex items-center justify-center overflow-hidden"
          }
        >
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="comparison"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative h-full w-full"
              >
                <ComparisonSlider
                  key={resultUrl || image.id}
                  beforeImage={image.preview}
                  afterImage={resultUrl!}
                  beforeLabel="Original"
                  afterLabel="Background Removed"
                  className="h-full"
                />
                <motion.div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-lime-300/10"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  <motion.div
                    initial={{ scale: 0.82, y: 8 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="rounded-full border border-lime-300/40 bg-black/70 px-4 py-2 text-sm font-semibold text-lime-100 backdrop-blur"
                  >
                    Background removed
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full max-h-[70vh] flex items-center justify-center overflow-hidden"
              >
                <img
                  src={image.preview}
                  alt="Preview"
                  className="max-h-[70vh] max-w-full w-auto h-auto object-contain"
                  draggable={false}
                />

                <AnimatePresence>
                  {showLoadingOverlay && (
                    <ProcessingOverlay image={image} isResultFetching={isResultFetching} />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
