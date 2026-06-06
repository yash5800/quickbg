"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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
  Copy,
  BadgeInfo,
  Frame,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RatingWidget } from "@/components/rating-widget";
import { addBorder, addWatermark, blobToDataUrl } from "@/lib/image-operations";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes < 10 ? 1 : 0)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes < 10 ? 1 : 0)} MB`;
}

function getPanelProgress(image: ImageItem, isResultFetching: boolean): number {
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

interface PreviewInfoProps {
  image: ImageItem;
  isProcessing: boolean;
  isResultFetching: boolean;
  isCompleted: boolean;
  isError: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onDownload: () => void;
  onCopy?: () => void;
  onUpdateResult?: (dataUrl: string) => void;
  isDownloading: boolean;
  liveStatus: string;
  onOpenEraser?: () => void;
}

export function PreviewInfo({
  image,
  isProcessing,
  isResultFetching,
  isCompleted,
  isError,
  onRemove,
  onRetry,
  onDownload,
  onCopy,
  onUpdateResult,
  isDownloading,
  liveStatus,
  onOpenEraser,
}: PreviewInfoProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const watermarkSectionRef = useRef<HTMLDivElement | null>(null);
  const [showWatermarkHint, setShowWatermarkHint] = useState(false);
  const [processedDimensions, setProcessedDimensions] = useState<{ width: number; height: number } | null>(null);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.55);
  const [watermarkSize, setWatermarkSize] = useState(28);
  const [watermarkColor, setWatermarkColor] = useState("#ffffff");
  const [watermarkPosition, setWatermarkPosition] = useState<"center" | "bottom-right" | "bottom-left" | "top-right" | "top-left">("bottom-right");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#84cc16");
  const [isApplyingTool, setIsApplyingTool] = useState(false);
  const status = liveStatus !== "unknown" ? liveStatus : image.status;
  const displayStatus = isResultFetching ? "fetching_result" : status;

  useEffect(() => {
    setShowWatermarkHint(isCompleted && Boolean(image.result));
  }, [isCompleted, image.id, image.result]);

  useEffect(() => {
    if (!showWatermarkHint) return;

    const handleScroll = () => {
      if (window.scrollY > 80) {
        setShowWatermarkHint(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showWatermarkHint]);

  const statusConfig = {
    pending: { label: "Waiting", icon: Clock, color: "bg-slate-500/10 text-slate-600" },
    starting: { label: "Starting", icon: Loader2, color: "bg-primary/10 text-primary" },
    uploading: { label: "Uploading", icon: Loader2, color: "bg-primary/10 text-primary" },
    queued: { label: "In Queue", icon: Loader2, color: "bg-secondary/10 text-amber-600" },
    processing: { label: "Processing", icon: Loader2, color: "bg-primary/10 text-primary" },
    running: { label: "Processing", icon: Loader2, color: "bg-primary/10 text-primary" },
    uploading_result: { label: "Finalizing", icon: Loader2, color: "bg-primary/10 text-primary" },
    fetching_result: { label: "Fetching processed image", icon: Loader2, color: "bg-secondary/10 text-amber-600" },
    completed: { label: "Done", icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
    error: { label: "Failed", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    failed: { label: "Failed", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    expired: { label: "Expired", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    cancelled: { label: "Cancelled", icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
  }[displayStatus as string] || { label: displayStatus, icon: Clock, color: "bg-slate-500/10 text-slate-600" };

const StatusIcon = statusConfig.icon;
  const progress = getPanelProgress(image, isResultFetching);
  const timeline = [
    { label: "Upload", active: ["uploading"].includes(image.status), done: progress >= 24 },
    { label: "Queue", active: image.status === "queued", done: progress >= 42 },
    { label: "Mask", active: isProcessing && image.status !== "uploading" && image.status !== "queued", done: progress >= 72 },
    { label: "Ready", active: isResultFetching, done: isCompleted },
  ];

  useEffect(() => {
    if (!image.result) {
      setProcessedDimensions(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setProcessedDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = image.result;

    return () => {
      cancelled = true;
    };
  }, [image.result]);

  const fileFormat = image.file.type?.split("/")[1]?.toUpperCase() || image.file.name.split(".").pop()?.toUpperCase() || "IMAGE";

  const resultToFile = async () => {
    if (!image.result) throw new Error("No processed image");
    const response = await fetch(image.result);
    const blob = await response.blob();
    return new File([blob], `${image.file.name.split(".")[0]}-quickbg.png`, { type: blob.type || "image/png" });
  };

  const applyWatermark = async () => {
    if (!onUpdateResult || !watermarkText.trim()) return;
    setIsApplyingTool(true);
    try {
      const file = await resultToFile();
      const blob = await addWatermark(file, {
        text: watermarkText.trim(),
        fontSize: watermarkSize,
        color: watermarkColor,
        opacity: watermarkOpacity,
        position: watermarkPosition,
      });
      onUpdateResult(await blobToDataUrl(blob));
    } finally {
      setIsApplyingTool(false);
    }
  };

  const applyBorder = async () => {
    if (!onUpdateResult || borderWidth <= 0) return;
    setIsApplyingTool(true);
    try {
      const file = await resultToFile();
      const blob = await addBorder(file, { width: borderWidth, color: borderColor });
      onUpdateResult(await blobToDataUrl(blob));
    } finally {
      setIsApplyingTool(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <AnimatePresence>
        {showWatermarkHint && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            onClick={() => watermarkSectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })}
            className="fixed bottom-4 right-6 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg shadow-black/10 backdrop-blur-md"
          >
            <span>watermark tools</span>
            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="text-primary"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* File Info Card */}
      <Card className="premium-surface p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm truncate text-foreground"
              title={image.file.name}
            >
              {image.file.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(image.file.size)}
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
        <div className="flex items-center justify-between gap-3">
          <Badge variant={isError ? "destructive" : isCompleted ? "success" : isProcessing || isResultFetching ? "warning" : "outline"} className={cn("gap-2", statusConfig.color)}>
            {status === "processing" || status === "queued" || status === "running" || status === "uploading" || status === "starting" || status === "uploading_result" || isResultFetching ? (
              <StatusIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <StatusIcon className="h-3.5 w-3.5" />
            )}
            {statusConfig.label}
          </Badge>
          <span className="text-xs tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
        </div>

        <div className="space-y-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-lime-300"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 95, damping: 20 }}
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {timeline.map((step) => (
              <motion.div
                key={step.label}
                initial={false}
                animate={{
                  opacity: step.done || step.active ? 1 : 0.46,
                  y: step.active ? -1 : 0,
                }}
                className={cn(
                  "rounded-lg border px-1.5 py-1.5 text-center text-[10px] font-medium",
                  step.done
                    ? "border-secondary/40 bg-secondary/10 text-secondary"
                    : step.active
                      ? "border-secondary/40 bg-secondary/10 text-secondary"
                      : "border-border/70 bg-background/30 text-muted-foreground"
                )}
              >
                {step.label}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Waiting states */}
      <AnimatePresence>
        {image.status === "pending" && image.waitingReason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 space-y-3 bg-secondary/10 border-amber-500/30">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-secondary/80">
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
            <Card className="p-4 space-y-3 bg-amber-500/5 border-secondary/20">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-secondary/80">
                Position in Queue
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>#</span>
                    <span>Your Position</span>
                  </div>
                  <span className="font-semibold text-2xl text-amber-600 dark:text-secondary/80">
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
                {processedDimensions && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BadgeInfo className="h-4 w-4" />
                      <span>Processed</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {processedDimensions.width} × {processedDimensions.height}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileBadgeIcon />
                    <span>Format</span>
                  </div>
                  <Badge variant="outline">{fileFormat}</Badge>
                </div>
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
            {onCopy && (
              <Button
                onClick={onCopy}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy PNG
              </Button>
            )}
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
                sessionStorage.setItem("toolSourceFileName", image.file.name);
                router.push("/sharpness");
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Sharpness
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                sessionStorage.setItem("toolImages", JSON.stringify([{ preview: image.result!, name: image.file.name }]));
                router.push("/converter");
              }}
            >
              <Frame className="h-3 w-3 mr-1" />
              Convert
            </Button>
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
          <motion.div
            ref={watermarkSectionRef}
            initial={false}
            animate={isCompleted ? { opacity: 1, y: 0 } : { opacity: 0.98, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
            className="mt-3 space-y-3 rounded-lg border border-border/70 p-3"
          >
            <div className="relative overflow-hidden rounded-lg bg-muted/40 p-2">
              <img
                src={image.result}
                alt="Watermark preview"
                className="mx-auto max-h-32 max-w-full object-contain"
                style={{ border: borderWidth > 0 ? `${Math.max(1, borderWidth / 4)}px solid ${borderColor}` : undefined }}
              />
              {watermarkText.trim() && (
                <span
                  className={cn(
                    "pointer-events-none absolute rounded bg-black/20 px-1 font-semibold text-white",
                    watermarkPosition === "top-left" && "left-3 top-3",
                    watermarkPosition === "top-right" && "right-3 top-3",
                    watermarkPosition === "bottom-left" && "bottom-3 left-3",
                    watermarkPosition === "bottom-right" && "bottom-3 right-3",
                    watermarkPosition === "center" && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  )}
                  style={{ color: watermarkColor, opacity: watermarkOpacity, fontSize: `${Math.max(10, watermarkSize / 2)}px` }}
                >
                  {watermarkText}
                </span>
              )}
            </div>

            <motion.div
              initial={false}
              animate={isCompleted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
              className="space-y-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Watermark</p>
              <input
                value={watermarkText}
                onChange={(event) => setWatermarkText(event.target.value)}
                placeholder="Watermark text"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="color" value={watermarkColor} onChange={(event) => setWatermarkColor(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background" />
                <select value={watermarkPosition} onChange={(event) => setWatermarkPosition(event.target.value as typeof watermarkPosition)} className="h-9 rounded-lg border border-input bg-background px-2 text-xs">
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                  <option value="top-right">Top right</option>
                  <option value="top-left">Top left</option>
                  <option value="center">Center</option>
                </select>
              </div>
              <label className="block text-xs text-muted-foreground">
                Size {watermarkSize}px
                <input type="range" min="12" max="96" value={watermarkSize} onChange={(event) => setWatermarkSize(Number(event.target.value))} className="mt-1 w-full" />
              </label>
              <label className="block text-xs text-muted-foreground">
                Opacity {Math.round(watermarkOpacity * 100)}%
                <input type="range" min="0.1" max="1" step="0.05" value={watermarkOpacity} onChange={(event) => setWatermarkOpacity(Number(event.target.value))} className="mt-1 w-full" />
              </label>
              <Button size="sm" className="w-full" disabled={isApplyingTool || !watermarkText.trim()} onClick={() => void applyWatermark()}>
                Apply Watermark
              </Button>
            </motion.div>

            <div className="space-y-2 border-t border-border/70 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Border</p>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <label className="text-xs text-muted-foreground">
                  Width {borderWidth}px
                  <input type="range" min="0" max="80" value={borderWidth} onChange={(event) => setBorderWidth(Number(event.target.value))} className="mt-1 w-full" />
                </label>
                <input type="color" value={borderColor} onChange={(event) => setBorderColor(event.target.value)} className="mt-4 h-9 w-12 rounded-lg border border-input bg-background" />
              </div>
              <Button size="sm" variant="outline" className="w-full" disabled={isApplyingTool || borderWidth <= 0} onClick={() => void applyBorder()}>
                Apply Border
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {isCompleted && <RatingWidget tool="remover" imageId={image.id} jobId={image.jobId} />}
    </motion.div>
  );
}

function FileBadgeIcon() {
  return <BadgeInfo className="h-4 w-4" />;
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
    <span className="font-bold text-amber-600 dark:text-secondary/80 tabular-nums">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}
