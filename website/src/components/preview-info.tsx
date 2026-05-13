"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ImageItem } from "@/types/image";
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Monitor,
  Layers,
  Palette,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PreviewInfoProps {
  image: ImageItem;
  isProcessing: boolean;
  isCompleted: boolean;
  isError: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  liveStatus: string;
  onOpenEraser?: () => void;
}

export function PreviewInfo({
  image,
  isProcessing,
  isCompleted,
  isError,
  onRemove,
  onRetry,
  onDownload,
  isDownloading,
  liveStatus,
  onOpenEraser,
}: PreviewInfoProps) {
  const router = useRouter();
  const status = liveStatus !== "unknown" ? liveStatus : image.status;

  const statusConfig = {
    pending: { label: "Waiting", icon: Clock, color: "bg-slate-500/10 text-slate-600" },
    starting: { label: "Starting", icon: Loader2, color: "bg-blue-500/10 text-blue-600" },
    uploading: { label: "Uploading", icon: Loader2, color: "bg-blue-500/10 text-blue-600" },
    queued: { label: "In Queue", icon: Loader2, color: "bg-amber-500/10 text-amber-600" },
    processing: { label: "Processing", icon: Loader2, color: "bg-primary/10 text-primary" },
    running: { label: "Processing", icon: Loader2, color: "bg-primary/10 text-primary" },
    uploading_result: { label: "Finalizing", icon: Loader2, color: "bg-primary/10 text-primary" },
    completed: { label: "Done", icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
    error: { label: "Failed", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    failed: { label: "Failed", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    expired: { label: "Expired", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    cancelled: { label: "Cancelled", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
  }[status as string] || { label: status, icon: Clock, color: "bg-slate-500/10 text-slate-600" };

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* File Info Card */}
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm truncate text-foreground"
              title={image.file.name}
            >
              {image.file.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {(image.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title="Delete image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Badge */}
        <Badge variant={isError ? "destructive" : isCompleted ? "success" : isProcessing ? "warning" : "outline"} className={cn("gap-2", statusConfig.color)}>
          {status === "processing" || status === "queued" || status === "running" || status === "uploading" || status === "starting" || status === "uploading_result" ? (
            <StatusIcon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <StatusIcon className="h-3.5 w-3.5" />
          )}
          {statusConfig.label}
        </Badge>

              </Card>

      {/* Waiting states */}
      <AnimatePresence>
        {image.status === "pending" && image.waitingReason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 space-y-3 bg-amber-500/10 border-amber-500/30">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {image.waitingReason === "credits_exhausted" ? "Hourly limit reached" : "Queue is full"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {image.waitingReason === "credits_exhausted"
                  ? "This image will process automatically when credits reset."
                  : "This image will process automatically when queue capacity opens."}
              </p>
              {image.waitingReason === "credits_exhausted" && image.creditResetAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-muted-foreground">Resets in</span>
                  <ResetTimer resetAt={image.creditResetAt} />
                </div>
              )}
              {image.waitingReason === "queue_full" && image.queueRetryAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-muted-foreground">Retrying in</span>
                  <ResetTimer resetAt={image.queueRetryAt} />
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Position Info */}
      <AnimatePresence>
        {image.status === "queued" && image.queuePosition != null && image.queuePosition > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 space-y-3 bg-amber-500/5 border-amber-500/20">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Position in Queue
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>#</span>
                    <span>Your Position</span>
                  </div>
                  <span className="font-semibold text-2xl text-amber-600 dark:text-amber-400">
                    {image.queuePosition}
                  </span>
                </div>

                {image.estimatedWaitSeconds && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Est. Wait</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      ~{image.estimatedWaitSeconds}s
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Info - Show when completed */}
      <AnimatePresence>
        {isCompleted && image.duration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 space-y-3 bg-green-500/5 border-green-500/20">
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
                Processing Complete
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Processing Time</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {(image.duration / 1000).toFixed(2)}s
                  </span>
                </div>

                {image.dimensions && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                      <span>Resolution</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {image.dimensions.width} × {image.dimensions.height}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 space-y-3 bg-destructive/5 border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-destructive">
                    Processing Failed
                  </h4>
                  {image.error && (
                    <p className="text-xs text-muted-foreground mt-1">{image.error}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {isCompleted && (
          <>
            <Button
              onClick={onDownload}
              disabled={isDownloading}
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            <Button
              onClick={onRemove}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        )}

        {isError && (
          <>
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Retry Processing
            </Button>
            <Button
              onClick={onRemove}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        )}

        {isProcessing && (
          <Button
            onClick={onRemove}
            variant="destructive"
            className="w-full"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}

        {!isProcessing && !isCompleted && !isError && (
          <Button
            onClick={onRemove}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Tools Section */}
      {isCompleted && image.result && (
        <div className="pt-2 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Quick Edit
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {onOpenEraser && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={onOpenEraser}
              >
                <Eraser className="h-3 w-3 mr-1" />
                Eraser
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                sessionStorage.setItem("originalImage", image.preview);
                sessionStorage.setItem("processedImage", image.result!);
                router.push("/blur-bg");
              }}
            >
              <Layers className="h-3 w-3 mr-1" />
              Blur BG
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                sessionStorage.setItem("originalImage", image.preview);
                sessionStorage.setItem("processedImage", image.result!);
                router.push("/replace-bg");
              }}
            >
              <Palette className="h-3 w-3 mr-1" />
              Replace BG
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Live timer component for credit reset countdown
function ResetTimer({ resetAt }: { resetAt: number }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [resetAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}
