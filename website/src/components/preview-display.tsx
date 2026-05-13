"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "@/types/image";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const ComparisonSlider = dynamic(
  () => import("@/components/comparison-slider").then((mod) => mod.ComparisonSlider),
  { ssr: false }
);

interface PreviewDisplayProps {
  image: ImageItem;
  resultUrl: string | null;
  isProcessing: boolean;
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function PreviewDisplay({
  image,
  resultUrl,
  isProcessing,
}: PreviewDisplayProps) {
  const isCompleted = !!resultUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-muted/50 border-2 border-border/50">
        <div className="relative w-full aspect-video sm:aspect-square lg:aspect-auto lg:h-[500px] bg-muted flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="comparison"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <ComparisonSlider
                  beforeImage={image.preview}
                  afterImage={resultUrl!}
                  beforeLabel="Original"
                  afterLabel="Background Removed"
                  className="h-full"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <img
                  src={image.preview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain p-4 sm:p-8"
                  draggable={false}
                />

                {/* Processing Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/40 flex flex-col items-center justify-center gap-3"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-12 w-12 text-white" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-white font-semibold text-lg">
                          {image.status === "uploading"
                            ? "Uploading..."
                            : image.status === "queued"
                            ? image.queuePosition != null && image.queuePosition > 0
                              ? `Queue Position: #${image.queuePosition}`
                              : "In Queue..."
                            : "Processing..."}
                        </p>
                        <p className="text-white/70 text-sm mt-1">
                          {image.status === "queued" && image.estimatedWaitSeconds
                            ? `Est. wait: ${formatWait(image.estimatedWaitSeconds)}`
                            : "Please wait, this may take a moment"}
                        </p>
                      </div>
                    </motion.div>
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
