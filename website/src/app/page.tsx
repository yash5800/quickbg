"use client";

import React, { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useImages } from "@/contexts/ImageContext";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";

export default function Home() {
  const { images, addImages } = useImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        addImages(files);
        // Navigate to editor when files are added
        router.push("/editor");
      }
      e.target.value = "";
    },
    [addImages, router]
  );

  // If images exist and user is on home, show link to editor
  const hasImages = images.length > 0;

  return (
    <AppLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center min-h-[60vh]"
        >
          {/* Hero Content */}
          <div className="text-center mb-12 max-w-3xl space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                ✨ AI-Powered
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl font-bold tracking-tight"
            >
              Remove Backgrounds{" "}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Instantly
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Professional AI-powered background removal. Upload your images and get crystal clear
              results in seconds. Perfect for e-commerce, portraits, and product shots.
            </motion.p>
          </div>

          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl cursor-pointer group"
          >
            <div className="relative rounded-3xl border-2 border-dashed border-muted-foreground/30 p-12 sm:p-16 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/5 bg-muted/20 overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-300" />

              {/* Content */}
              <div className="relative flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg"
                >
                  <Upload className="h-10 w-10" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Drag images here or click
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg mb-4">
                  Upload up to 5 images at once
                </p>

                <div className="flex gap-2 flex-wrap justify-center text-xs text-muted-foreground/70">
                  <span className="bg-muted/50 px-3 py-1 rounded-full">PNG</span>
                  <span className="bg-muted/50 px-3 py-1 rounded-full">JPG</span>
                  <span className="bg-muted/50 px-3 py-1 rounded-full">WebP</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* View Processing Images Link */}
          {hasImages && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Link
                href="/editor"
                className="text-primary hover:text-primary/80 font-medium"
              >
                View {images.length} processing image{images.length !== 1 ? "s" : ""} →
              </Link>
            </motion.div>
          )}

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full max-w-2xl"
          >
            {[
              { label: "Lightning Fast", value: "< 5 seconds" },
              { label: "High Quality", value: "4K Support" },
              { label: "Batch Process", value: "Up to 5 at once" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="text-center p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="text-2xl font-bold text-primary">{feature.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {feature.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
