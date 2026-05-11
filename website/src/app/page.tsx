"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload,
  Scissors,
  Maximize2,
  Palette,
  Layers,
  Crop,
  Zap,
  Contrast,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useImages } from "@/contexts/ImageContext";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StockSample, stockSamples } from "@/lib/stock-samples";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image with AI precision",
    badge: "Core",
    href: "/remover",
    color: "from-primary to-blue-500",
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize images without losing quality using AI upscaling",
    badge: "Popular",
    href: "/resize",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Replace backgrounds with solid colors, gradients, or images",
    badge: "New",
    href: "/replace-bg",
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Add beautiful blur effects to background",
    badge: null,
    href: "/blur-bg",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Auto-crop to perfect aspect ratios for social media and ads",
    badge: null,
    href: "/crop",
    color: "from-emerald-500 to-green-500",
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Fine-tune brightness, contrast, and saturation levels",
    badge: null,
    href: "/adjust",
    color: "from-blue-600 to-cyan-600",
  },
];

export default function Home() {
  const { images, addImages } = useImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        addImages(files);
        // Navigate to editor when files are added
        router.push("/remover");
      }
      e.target.value = "";
    },
    [addImages, router]
  );

  const handleSampleSelect = useCallback(
    async (sample: StockSample) => {
      if (loadingSampleId) return;

      try {
        setLoadingSampleId(sample.id);
        const response = await fetch(sample.image.src);

        if (!response.ok) {
          throw new Error(`Could not load ${sample.fileName}`);
        }

        const blob = await response.blob();
        const file = new File([blob], sample.fileName, {
          type: blob.type || "image/jpeg",
        });

        addImages([file]);
        router.push("/remover");
      } catch (error) {
        console.error("[Home] Failed to load stock sample", error);
      } finally {
        setLoadingSampleId(null);
      }
    },
    [addImages, loadingSampleId, router]
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
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {/* Hero Content */}
          <div className="text-center mb-8 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-sm">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                AI background removal
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Upload an image. Get a clean cutout.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Use your own image or try a sample. Every image runs through the
              same remover queue, so the demo behaves like the real workflow.
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl cursor-pointer group"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card p-8 shadow-sm transition-all duration-200 group-hover:border-primary/60 group-hover:bg-primary/5 sm:p-10">
              <div className="relative flex flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Drop images here or click to upload
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-4">
                  Batch upload supported. Results download as PNG.
                </p>

                <div className="flex gap-2 flex-wrap justify-center text-xs text-muted-foreground/70">
                  <span className="bg-muted px-3 py-1 rounded-full">PNG</span>
                  <span className="bg-muted px-3 py-1 rounded-full">JPG</span>
                  <span className="bg-muted px-3 py-1 rounded-full">WebP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 w-full max-w-5xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Try a sample
                </h2>
                <p className="text-xs text-muted-foreground">
                  These use the real background-remover flow.
                </p>
              </div>
              {loadingSampleId && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading sample
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stockSamples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSampleSelect(sample)}
                  disabled={!!loadingSampleId}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:pointer-events-none disabled:opacity-70"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={sample.image}
                      alt={`${sample.label} sample`}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      placeholder="blur"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {sample.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sample.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-primary">
                      Try
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* View Processing Images Link */}
          {hasImages && (
            <div className="mt-8">
              <Link
                href="/remover"
                className="text-primary hover:text-primary/80 font-medium"
              >
                View {images.length} processing image{images.length !== 1 ? "s" : ""} →
              </Link>
            </div>
          )}

          {/* Tools Section */}
          <div className="w-full max-w-5xl mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Powerful Tools
              </h2>
              <p className="text-muted-foreground text-sm">
                All the image editing tools you need in one place
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tools.map((tool) => (
                <div key={tool.id}>
                  <Link
                    href={tool.href}
                    className="group relative block p-5 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                    onClick={(e) => {
                      if (tool.id === "remove-bg" && !hasImages) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {tool.badge && (
                      <span className={cn(
                        "absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r text-white shadow-md",
                        tool.badge === "Core" ? "from-primary to-blue-500" :
                        tool.badge === "Popular" ? "from-violet-500 to-purple-500" :
                        tool.badge === "New" ? "from-cyan-500 to-teal-500" :
                        "from-indigo-500 to-blue-600"
                      )}>
                        {tool.badge}
                      </span>
                    )}

                    <div className={cn(
                      "w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                      tool.color
                    )}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>

                    <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Use tool</span>
                      <Zap className="h-3 w-3" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full max-w-2xl">
            {[
              { label: "Lightning Fast", value: "< 15 seconds" },
              { label: "High Quality", value: "4K Support" },
              { label: "Batch Process", value: "Unlimited" },
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
