"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ImageIcon,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useImages, ImageItem } from "@/contexts/ImageContext";
import { submitImage, getJobResult } from "@/lib/worker-api";
import { useJobStatus } from "@/hooks/useJobStatus";
import { ComparisonSlider } from "@/components/comparison-slider";

export default function Home() {
  const { images, addImages } = useImages();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        addImages(acceptedFiles);
      }
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground relative">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {images.length === 0 ? (
            <HeroSection
              key="hero"
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
            />
          ) : (
            <Dashboard
              key="dashboard"
              images={images}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HeroSection({ getRootProps, getInputProps, isDragActive }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Remove Backgrounds <span className="text-primary">Instantly</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          AI-powered background removal. Upload an image and get professional results in seconds.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "w-full max-w-xl cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/20 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
            isDragActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {isDragActive ? "Drop to upload" : "Drop images here or click to browse"}
        </h3>
        <p className="text-muted-foreground text-sm">
          Supports PNG, JPG, WebP
        </p>
      </div>
    </motion.div>
  );
}

function Dashboard({ images, getRootProps, getInputProps }: any) {
  const { removeImage } = useImages();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Your Images</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {images.length} {images.length === 1 ? "image" : "images"} uploaded
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => document.getElementById("add-more-input")?.click()}
        >
          <input id="add-more-input" {...getInputProps()} />
          <Upload className="h-4 w-4 mr-2" />
          Add More
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {images.map((image: ImageItem) => (
          <JobCard key={image.id} image={image} onRemove={() => removeImage(image.id)} />
        ))}
      </div>
    </motion.div>
  );
}

function JobCard({ image, onRemove }: { image: ImageItem; onRemove: () => void }) {
  const { updateImageStatus, updateImage } = useImages();
  const [jobId, setJobId] = useState<string | null>(image.jobId || null);
  const { status: liveStatus, error: liveError } = useJobStatus(jobId);
  const [resultUrl, setResultUrl] = useState<string | null>(image.result || null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (image.status === "pending") {
      startProcessing();
    }
  }, [image.status]);

  useEffect(() => {
    if (liveStatus !== "unknown" && liveStatus !== image.status) {
      updateImageStatus(image.id, liveStatus as any);
    }
  }, [liveStatus, image.id, image.status]);

  useEffect(() => {
    if (liveStatus === "completed" && !resultUrl && jobId) {
      fetchResult();
    }
  }, [liveStatus, resultUrl, jobId]);

  const startProcessing = async () => {
    try {
      updateImageStatus(image.id, "uploading");
      const response = await submitImage(image.file);

      if (response.status === "completed" && response.imageBlob) {
        const url = URL.createObjectURL(response.imageBlob);
        setResultUrl(url);
        updateImageStatus(image.id, "completed", { result: url, jobId: "direct" });
      } else {
        setJobId(response.job_id);
        updateImageStatus(image.id, "queued", { jobId: response.job_id });
      }
    } catch (err: any) {
      console.error("Processing failed:", err);
      updateImageStatus(image.id, "error", { error: err.message });
    }
  };

  const fetchResult = async () => {
    if (!jobId) return;
    try {
      const blob = await getJobResult(jobId);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      updateImage(image.id, { result: url });
    } catch (err) {
      console.error("Failed to fetch result:", err);
    }
  };

  const downloadResult = async () => {
    if (!resultUrl || isDownloading) return;
    setIsDownloading(true);
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${image.file.name.split(".")[0]}-nobg.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsDownloading(false), 500);
  };

  const isCompleted = image.status === "completed" && !!resultUrl;
  const isError = image.status === "error" || liveStatus === "failed";
  const isQueued = image.status === "queued" || image.status === "uploading";
  const isRunning = image.status === "running" || image.status === "processing";
  const isProcessing = isQueued || isRunning;

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-64 h-48 sm:h-auto bg-muted shrink-0">
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full"
              >
                <ComparisonSlider
                  beforeImage={image.preview}
                  afterImage={resultUrl!}
                  className="h-full"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                      <span className="text-white text-sm font-medium">
                        {isQueued ? "Waiting..." : "Processing..."}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-sm truncate" title={image.file.name}>
                {image.file.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(image.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <StatusIndicator status={image.status} liveStatus={liveStatus} />

          {isError && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <p className="font-medium">Processing failed</p>
              <p className="text-xs mt-1 opacity-80">{image.error || liveError}</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            {isCompleted ? (
              <Button
                onClick={downloadResult}
                disabled={isDownloading}
                className="w-full"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download PNG"}
              </Button>
            ) : isError ? (
              <Button onClick={startProcessing} variant="outline" size="sm" className="w-full">
                Try Again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status, liveStatus }: { status: string; liveStatus: string }) {
  const s = liveStatus !== "unknown" ? liveStatus : status;

  const config = {
    pending: { label: "Waiting", color: "bg-muted text-muted-foreground" },
    uploading: { label: "Uploading", color: "bg-blue-500/10 text-blue-600" },
    queued: { label: "In Queue", color: "bg-amber-500/10 text-amber-600" },
    processing: { label: "Processing", color: "bg-primary/10 text-primary" },
    running: { label: "Processing", color: "bg-primary/10 text-primary" },
    completed: { label: "Done", color: "bg-green-500/10 text-green-600" },
    error: { label: "Failed", color: "bg-destructive/10 text-destructive" },
    failed: { label: "Failed", color: "bg-destructive/10 text-destructive" },
  }[s as string] || { label: s, color: "bg-muted text-muted-foreground" };

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.color)}>
      {s === "completed" && <CheckCircle2 className="h-3 w-3" />}
      {s === "processing" || s === "running" || s === "uploading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : null}
      {(s === "error" || s === "failed") && <AlertCircle className="h-3 w-3" />}
      {config.label}
    </div>
  );
}