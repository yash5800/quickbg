"use client";

import React, { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, Zap, Lock, RotateCcw } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useImages } from "@/contexts/ImageContext";
import { JobDashboard } from "@/views/job-dashboard";
import { HistoryGallery } from "@/components/ui/history-gallery";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "AI-powered background removal in seconds"
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your images stay private and secure"
  },
  {
    icon: RotateCcw,
    title: "Unlimited Workflow",
    description: "Batch process images with no hidden limits"
  }
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
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary)_0%,transparent_50%)] opacity-[0.08] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--primary)_0%,transparent_50%)] opacity-[0.05] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Professional AI Background Removal</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Clean, polished image backgrounds
            <br />
            <span className="text-primary">for every project</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Powerful AI removes image backgrounds with precision and speed. Ideal for product photography, marketing, design, and content creation.
          </p>
        </motion.div>

        {/* Features Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-all hover:border-border/80 hover:shadow-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Upload Zone - Premium Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div
            {...getRootProps()}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all duration-300",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
                : "border-border/40 bg-gradient-to-br from-card/50 to-card/30 hover:border-primary/60 hover:bg-card/50 hover:shadow-md"
            )}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              className={cn(
                "mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
                isDragActive ? "bg-primary/20 text-primary shadow-lg" : "bg-primary/10 text-primary/60"
              )}
            >
              <Upload className="h-10 w-10" />
            </motion.div>

            <h3 className="text-2xl font-semibold mb-2">
              {isDragActive ? "Drop your images here" : "Upload your images"}
            </h3>
            <p className="text-muted-foreground mb-6">
              or click to browse from your computer
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {["PNG", "JPG", "WebP", "TIFF"].map((fmt) => (
                <span key={fmt} className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {fmt}
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Supports batch processing • Max 100MB per image
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-16"
        >
          <Button
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 rounded-lg px-8 h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <ImageIcon className="h-5 w-5" />
            Upload Images
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Trusted by professionals • No sign-up required
          </p>
        </motion.div>

        {/* Job Dashboard */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <JobDashboard />
        </motion.section>

        {/* History Gallery */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <HistoryGallery />
        </motion.section>
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
