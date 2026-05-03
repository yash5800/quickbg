"use client";

import React, { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Upload, Zap, Shield, Image, Clock } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useImages } from "@/contexts/ImageContext";

const features = [
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Remove backgrounds in seconds with optimized AI",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Images processed locally, never stored on servers",
  },
  {
    icon: Image,
    title: "High Quality",
    description: "Advanced AI maintains image quality",
  },
  {
    icon: Clock,
    title: "Batch Support",
    description: "Process multiple images at once",
  },
];

export default function Home() {
  const router = useRouter();
  const { addImages } = useImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        addImages(acceptedFiles);
        router.push("/uploads");
      }
    },
    [addImages, router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 gradient-mesh opacity-60 dark:opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200 glass",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border/70 bg-card/40 hover:border-primary/50 hover:bg-card/60"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                  isDragActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Upload className="h-8 w-8" />
                </div>
                
                <p className="text-base font-medium text-foreground">
                  {isDragActive ? "Drop images here" : "Drag & drop images"}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {["PNG", "JPG", "WebP"].map((format) => (
                <span
                  key={format}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1"
                >
                  {format}
                </span>
              ))}
              <span className="ml-1">• Multiple files</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-primary">AI Powered</span>
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Remove Backgrounds <span className="text-primary">in Seconds</span>
              </h1>
              <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
                Professional background removal powered by advanced AI. 
                Upload your images and get transparent backgrounds in seconds.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 rounded-xl px-6"
            >
              Upload Image
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="rounded-xl border border-border/50 bg-card/50 p-3.5 transition-colors hover:bg-card/80 glass"
                >
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xs font-semibold">{feature.title}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) onDrop(files);
        }}
      />
    </div>
  );
}