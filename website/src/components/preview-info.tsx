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
  Stamp,
  SquareDashedBottom,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RatingWidget } from "@/components/rating-widget";
import { addBorder, addWatermark, blobToDataUrl } from "@/lib/image-operations";
import { clearSiteData } from "@/lib/clear-site-data";
import { useLocale } from "@/contexts/LocaleContext";

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

function ErrorCard({ image }: { image: ImageItem }) {
  const { t } = useLocale();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (countdown <= 0) {
      clearSiteData().then(() => location.reload());
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
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
              {t("remover.error.heading")}
            </h4>
            {image.error && (
              <p className="text-xs text-muted-foreground mt-1">{image.error}</p>
            )}
          </div>
        </div>
      </Card>
      <Card className="mt-2 p-3 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-start gap-2">
          <BadgeInfo className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Auto-fixing in {countdown}s — clears site data to reset session and fix credit display.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => clearSiteData().then(() => location.reload())}
                variant="outline"
                size="sm"
                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950"
              >
                Fix now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
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
  const { t } = useLocale();
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
    pending: { label: t("remover.status.waiting"), icon: Clock, color: "bg-slate-500/10 text-slate-600" },
    starting: { label: t("remover.status.starting"), icon: Loader2, color: "bg-primary/10 text-primary" },
    uploading: { label: t("remover.status.uploading"), icon: Loader2, color: "bg-primary/10 text-primary" },
    queued: { label: t("remover.status.inQueue"), icon: Loader2, color: "bg-secondary/10 text-amber-600" },
    processing: { label: t("remover.status.processing"), icon: Loader2, color: "bg-primary/10 text-primary" },
    running: { label: t("remover.status.processing"), icon: Loader2, color: "bg-primary/10 text-primary" },
    uploading_result: { label: t("remover.status.finalizing"), icon: Loader2, color: "bg-primary/10 text-primary" },
    fetching_result: { label: t("remover.status.fetching"), icon: Loader2, color: "bg-secondary/10 text-amber-600" },
    completed: { label: t("remover.status.done"), icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
    error: { label: t("remover.status.failed"), icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    failed: { label: t("remover.status.failed"), icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    expired: { label: t("remover.status.expired"), icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
    cancelled: { label: t("remover.status.cancelled"), icon: AlertCircle, color: "bg-red-500/10 text-red-600" },
  }[displayStatus as string] || { label: displayStatus, icon: Clock, color: "bg-slate-500/10 text-slate-600" };

const StatusIcon = statusConfig.icon;
  const progress = getPanelProgress(image, isResultFetching);
  const timeline = [
    { label: t("remover.timeline.upload"), active: ["uploading"].includes(image.status), done: progress >= 24 },
    { label: t("remover.timeline.queue"), active: image.status === "queued", done: progress >= 42 },
    { label: t("remover.timeline.mask"), active: isProcessing && image.status !== "uploading" && image.status !== "queued", done: progress >= 72 },
    { label: t("remover.timeline.ready"), active: isResultFetching, done: isCompleted },
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
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 backdrop-blur-md transition-transform hover:scale-[1.03]"
          >
            <Stamp className="h-4 w-4" />
            <span>{t("remover.watermark.heading")}</span>
            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
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
            title={t("remover.actions.delete")}
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
                {image.waitingReason === "credits_exhausted" ? t("remover.waiting.hourlyLimit") : t("remover.waiting.queueFull")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {image.waitingReason === "credits_exhausted"
                  ? t("remover.waiting.hourlyDesc")
                  : t("remover.waiting.queueDesc")}
              </p>
              {image.waitingReason === "credits_exhausted" && image.creditResetAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-muted-foreground">{t("remover.waiting.resetsIn")}</span>
                  <ResetTimer resetAt={image.creditResetAt} />
                </div>
              )}
              {image.waitingReason === "queue_full" && image.queueRetryAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-muted-foreground">{t("remover.waiting.retryingIn")}</span>
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
                {t("remover.queue.position")}
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>#</span>
                    <span>{t("remover.queue.yourPosition")}</span>
                  </div>
                  <span className="font-semibold text-2xl text-amber-600 dark:text-secondary/80">
                    {image.queuePosition}
                  </span>
                </div>

                {image.estimatedWaitSeconds && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{t("remover.queue.estWait")}</span>
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
                {t("remover.complete.heading")}
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t("remover.complete.time")}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {(image.duration / 1000).toFixed(2)}s
                  </span>
                </div>

                {image.dimensions && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                      <span>{t("remover.complete.resolution")}</span>
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
                      <span>{t("remover.complete.processed")}</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {processedDimensions.width} × {processedDimensions.height}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileBadgeIcon />
                    <span>{t("remover.complete.format")}</span>
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
          <ErrorCard image={image} />
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
              {isDownloading ? t("remover.actions.downloading") : t("remover.actions.download")}
            </Button>
            {onCopy && (
              <Button
                onClick={onCopy}
                variant="outline"
                className="w-full border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/15 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("remover.actions.copyPng")}
              </Button>
            )}
            <Button
              onClick={onRemove}
              variant="outline"
              className="w-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              {t("remover.actions.delete")}
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
              {t("remover.actions.retry")}
            </Button>
            <Button
              onClick={onRemove}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              {t("remover.actions.delete")}
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
            {t("remover.actions.cancel")}
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
            {t("remover.actions.delete")}
          </Button>
        )}
      </div>

      {/* Tools Section */}
      {isCompleted && image.result && (
        <div className="flex flex-col gap-3 border-t pt-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {t("remover.quickEdit.heading")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
            {onOpenEraser && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-rose-500/25 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
                onClick={onOpenEraser}
              >
                <Eraser className="h-3 w-3 mr-1" />
                {t("remover.quickEdit.eraser")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-amber-500/25 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
              onClick={() => {
                sessionStorage.setItem("originalImage", image.preview);
                sessionStorage.setItem("processedImage", image.result!);
                sessionStorage.setItem("toolSourceFileName", image.file.name);
                router.push("/sharpness");
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {t("remover.quickEdit.sharpness")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-violet-500/25 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
              onClick={() => {
                sessionStorage.setItem("toolImages", JSON.stringify([{ preview: image.result!, name: image.file.name }]));
                router.push("/converter");
              }}
            >
              <Frame className="h-3 w-3 mr-1" />
              {t("remover.quickEdit.convert")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-cyan-500/25 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/15 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
              onClick={() => {
                sessionStorage.setItem("originalImage", image.preview);
                sessionStorage.setItem("processedImage", image.result!);
                router.push("/blur-bg");
              }}
            >
              <Layers className="h-3 w-3 mr-1" />
              {t("remover.quickEdit.blurBg")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
              onClick={() => {
                sessionStorage.setItem("originalImage", image.preview);
                sessionStorage.setItem("processedImage", image.result!);
                router.push("/replace-bg");
              }}
            >
              <Palette className="h-3 w-3 mr-1" />
              {t("remover.quickEdit.replaceBg")}
            </Button>
            </div>
          </div>
          <motion.div
            ref={watermarkSectionRef}
            initial={false}
            animate={isCompleted ? { opacity: 1, y: 0 } : { opacity: 0.98, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
            className="premium-surface space-y-3 rounded-xl border-primary/30 bg-primary/5 p-3.5 shadow-lg shadow-primary/10 scroll-mt-24"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Stamp className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">{t("remover.watermark.heading")}</p>
                <p className="text-[11px] text-muted-foreground">{t("remover.watermark.placeholder")}</p>
              </div>
            </div>

            {/* Live preview on a checkerboard so the cutout AND the watermark are clearly visible */}
            <div className="checkerboard relative overflow-hidden rounded-lg border border-primary/25 ring-1 ring-primary/10">
              <div className="flex min-h-[8rem] items-center justify-center p-2">
                <img
                  src={image.result}
                  alt="Watermark preview"
                  className="max-h-32 max-w-full object-contain"
                  style={{ border: borderWidth > 0 ? `${Math.max(1, borderWidth / 4)}px solid ${borderColor}` : undefined }}
                />
              </div>
              {watermarkText.trim() && (
                <span
                  className={cn(
                    "pointer-events-none absolute font-bold",
                    watermarkPosition === "top-left" && "left-3 top-3",
                    watermarkPosition === "top-right" && "right-3 top-3",
                    watermarkPosition === "bottom-left" && "bottom-3 left-3",
                    watermarkPosition === "bottom-right" && "bottom-3 right-3",
                    watermarkPosition === "center" && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  )}
                  style={{
                    color: watermarkColor,
                    opacity: watermarkOpacity,
                    fontSize: `${Math.max(11, watermarkSize / 2)}px`,
                    // Dual outline keeps any colour legible on light or dark areas of the cutout
                    textShadow: "0 0 2px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.55)",
                  }}
                >
                  {watermarkText}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              <input
                value={watermarkText}
                onChange={(event) => setWatermarkText(event.target.value)}
                placeholder={t("remover.watermark.placeholder")}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2 text-xs text-muted-foreground">
                  <span className="shrink-0">{t("remover.watermark.heading")}</span>
                  <input type="color" value={watermarkColor} onChange={(event) => setWatermarkColor(event.target.value)} className="h-6 w-full cursor-pointer rounded bg-transparent" aria-label={t("remover.watermark.heading")} />
                </label>
                <select value={watermarkPosition} onChange={(event) => setWatermarkPosition(event.target.value as typeof watermarkPosition)} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" aria-label={t("remover.watermark.heading")}>
                  <option value="bottom-right">{t("remover.watermark.position.bottomRight")}</option>
                  <option value="bottom-left">{t("remover.watermark.position.bottomLeft")}</option>
                  <option value="top-right">{t("remover.watermark.position.topRight")}</option>
                  <option value="top-left">{t("remover.watermark.position.topLeft")}</option>
                  <option value="center">{t("remover.watermark.position.center")}</option>
                </select>
              </div>
              <label className="block text-xs text-muted-foreground">
                {t("remover.watermark.size")} <span className="font-semibold tabular-nums text-foreground">{watermarkSize}px</span>
                <input type="range" min="12" max="96" value={watermarkSize} onChange={(event) => setWatermarkSize(Number(event.target.value))} className="premium-slider mt-1.5 w-full" />
              </label>
              <label className="block text-xs text-muted-foreground">
                {t("remover.watermark.opacity")} <span className="font-semibold tabular-nums text-foreground">{Math.round(watermarkOpacity * 100)}%</span>
                <input type="range" min="0.1" max="1" step="0.05" value={watermarkOpacity} onChange={(event) => setWatermarkOpacity(Number(event.target.value))} className="premium-slider mt-1.5 w-full" />
              </label>
              <Button size="sm" className="w-full gap-2" disabled={isApplyingTool || !watermarkText.trim()} onClick={() => void applyWatermark()}>
                {isApplyingTool ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stamp className="h-4 w-4" />}
                {t("remover.watermark.apply")}
              </Button>
            </div>

            <div className="space-y-2.5 border-t border-border/70 pt-3">
              <div className="flex items-center gap-2">
                <SquareDashedBottom className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("remover.border.heading")}</p>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <label className="text-xs text-muted-foreground">
                  {t("remover.border.width")} <span className="font-semibold tabular-nums text-foreground">{borderWidth}px</span>
                  <input type="range" min="0" max="80" value={borderWidth} onChange={(event) => setBorderWidth(Number(event.target.value))} className="premium-slider mt-1.5 w-full" />
                </label>
                <input type="color" value={borderColor} onChange={(event) => setBorderColor(event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-background" aria-label={t("remover.border.heading")} />
              </div>
              <Button size="sm" variant="outline" className="w-full" disabled={isApplyingTool || borderWidth <= 0} onClick={() => void applyBorder()}>
                {t("remover.border.apply")}
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
