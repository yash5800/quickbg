"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Trash2,
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
            <GalleryView
              key="gallery"
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

function GalleryView({ images, getRootProps, getInputProps }: any) {
  const { removeImage } = useImages();
  const [selectedId, setSelectedId] = useState(images[0]?.id || null);

  React.useEffect(() => {
    if (images.length > 0 && !selectedId) {
      setSelectedId(images[0].id);
    }
  }, [images, selectedId]);

  const selectedImage = images.find((img: ImageItem) => img.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Remove Background</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {images.length} {images.length === 1 ? "image" : "images"}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("add-more-input")?.click()}
        >
          <input id="add-more-input" {...getInputProps()} />
          <Upload className="h-4 w-4 mr-2" />
          Add More
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {selectedImage && (
          <SelectedPreview
            key={selectedImage.id}
            image={selectedImage}
            onRemove={() => {
              const remaining = images.filter((i: ImageItem) => i.id !== selectedImage.id);
              if (remaining.length > 0) {
                setSelectedId(remaining[0].id);
              }
              removeImage(selectedImage.id);
            }}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3 font-medium">All Images</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image: ImageItem) => (
              <ImageThumbnail
                key={image.id}
                image={image}
                isSelected={image.id === selectedId}
                onClick={() => setSelectedId(image.id)}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SelectedPreview({ image, onRemove }: { image: ImageItem; onRemove: () => void }) {
  const { updateImageStatus, updateImage } = useImages();
  const [jobId, setJobId] = useState<string | null>(image.jobId || null);
  const { status: liveStatus } = useJobStatus(jobId);
  const [resultUrl, setResultUrl] = useState<string | null>(image.result || null);
  const [isDownloading, setIsDownloading] = useState(false);

  React.useEffect(() => {
    if (image.status === "pending") {
      startProcessing();
    }
  }, [image.id]);

  React.useEffect(() => {
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
  const isProcessing = ["queued", "uploading", "running", "processing"].includes(image.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-xl overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row">
        <div className="relative flex-1 aspect-[4/3] lg:aspect-auto lg:h-[450px] bg-muted">
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
                  className="w-full h-full object-contain p-8"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                      <span className="text-white text-sm font-medium">
                        {image.status === "queued" ? "Waiting..." : "Processing..."}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:w-72 p-5 border-t lg:border-t-0 lg:border-l flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-sm truncate max-w-[180px]" title={image.file.name}>
                {image.file.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(image.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <StatusIndicator status={image.status} liveStatus={liveStatus} />

          {isError && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <p className="font-medium">Processing failed</p>
              <p className="text-xs mt-1 opacity-80">{image.error}</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            {isCompleted ? (
              <Button onClick={downloadResult} disabled={isDownloading} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download PNG"}
              </Button>
            ) : isError ? (
              <Button onClick={startProcessing} variant="outline" className="w-full">
                Try Again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ImageThumbnail({ image, isSelected, onClick }: { image: ImageItem; isSelected: boolean; onClick: () => void }) {
  const { status: liveStatus } = useJobStatus(image.jobId || null);
  const isCompleted = image.status === "completed";
  const isProcessing = ["queued", "uploading", "running", "processing"].includes(image.status);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
      )}
    >
      <img
        src={image.preview}
        alt={image.file.name}
        className="w-full h-full object-cover"
      />
      {isCompleted && (
        <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-0.5">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        </div>
      )}
    </button>
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
      {["processing", "running", "uploading"].includes(s) && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {["error", "failed"].includes(s) && <AlertCircle className="h-3 w-3" />}
      {config.label}
    </div>
  );
}