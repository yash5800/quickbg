"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "@/contexts/ImageContext";
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}: PreviewInfoProps) {
  const status = liveStatus !== "unknown" ? liveStatus : image.status;

  const statusConfig = {
    pending: { label: "Waiting", icon: Clock, color: "bg-slate-500/10 text-slate-600" },
    uploading: { label: "Uploading", icon: Loader2, color: "bg-blue-500/10 text-blue-600" },
    queued: { label: "In Queue", icon: Loader2, color: "bg-amber-500/10 text-amber-600" },
    processing: { label: "Processing", icon: Loader2, color: "bg-primary/10 text-primary" },
    running: { label: "Processing", icon: Loader2, color: "bg-primary/10 text-primary" },
    completed: { label: "Done", icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
    error: { label: "Failed", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    failed: { label: "Failed", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
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
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
            statusConfig.color
          )}
        >
          {status === "processing" || status === "running" || status === "uploading" ? (
            <StatusIcon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <StatusIcon className="h-3.5 w-3.5" />
          )}
          {statusConfig.label}
        </div>
      </Card>

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
      {isCompleted && (
        <div className="pt-2 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Tools
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled
              title="Coming soon"
            >
              ✏️ Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled
              title="Coming soon"
            >
              ⚙️ Adjust
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
