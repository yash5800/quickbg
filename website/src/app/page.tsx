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
import { DemoRevealSlider } from "@/components/demo-reveal-slider";

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
  const [isDropActive, setIsDropActive] = useState(false);

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

  const handleDropZoneDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      setIsDropActive(true);
    }
  }, []);

  const handleDropZoneDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);
  }, []);

  const handleDropZoneDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDropZoneDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      addImages(files);
      router.push("/remover");
    }
  }, [addImages, router]);

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
        <div className="space-y-10 flex flex-col justify-center items-center">
          <div className="grid min-h-[60vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Hero Content */}
            <div className="text-center max-w-3xl space-y-4 lg:text-left lg:max-w-none">
            {/* Free Unlimited Ultimate Badges - Visual Shapes */}
            <div className="flex flex-wrap justify-center gap-2 mb-4 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-green-500/25 transform hover:scale-105 transition-transform">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                100% FREE
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-purple-500/25 transform hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.491-.88-1.193-.88-2.122 0-1.138.61-2.163 1.52-2.981a1 1 0 00-1.065-1.366z"/></svg>
                UNLIMITED
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-amber-500/25 transform hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ULTIMATE
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-sm">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                #1 Free Unlimited Background Remover
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Remove Backgrounds Free
              </span>
              <br />
              <span className="text-2xl sm:text-4xl text-muted-foreground">No Limits. No Signup. Forever.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              The ultimate <span className="text-green-400 font-semibold">free unlimited</span> background removal tool. Plus image resizer, background replacer, blur effects, smart crop & image adjuster <span className="text-amber-400 font-semibold">all free forever</span>. No signup, no limits, just upload and go.
            </p>

            {/* Quality Assurance */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm text-blue-400 font-medium">Original quality preserved • No compression • Full resolution</span>
            </div>
          </div>

            <div className="w-full max-w-2xl justify-self-center lg:max-w-none lg:justify-self-end">
              <DemoRevealSlider />
            </div>
          </div>

          {/* Page Content */}

          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDropZoneDragEnter}
            onDragLeave={handleDropZoneDragLeave}
            onDragOver={handleDropZoneDragOver}
            onDrop={handleDropZoneDrop}
            className="w-full max-w-2xl cursor-pointer group mx-auto"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card p-8 shadow-sm transition-all duration-200 group-hover:border-primary/60 group-hover:bg-primary/5 sm:p-10">
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center text-center rounded-xl transition-colors",
                  isDropActive && "bg-primary/10"
                )}
              >
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
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">All Free Unlimited Tools</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Background removal • Resize • Replace • Blur • Crop • Adjust • <span className="text-green-400 font-semibold">All 100% Free</span>
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

          {/* Features - Free Unlimited Ultimate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 w-full max-w-3xl">
            {[
              { label: "Lightning Fast", value: "< 15 sec", icon: "⚡", color: "from-yellow-500 to-orange-500" },
              { label: "100% Free Forever", value: "No Credit Card", icon: "🎁", color: "from-green-500 to-emerald-500" },
              { label: "Unlimited Usage", value: "No Limits", icon: "♾️", color: "from-purple-500 to-violet-500" },
              { label: "4K Quality", value: "Premium", icon: "💎", color: "from-amber-500 to-orange-500" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-center p-4 rounded-xl border hover:-translate-y-1 transition-all duration-300 cursor-default",
                  "bg-gradient-to-br from-muted/50 to-muted/30 border-border/50 hover:border-primary/40 hover:shadow-lg"
                )}
              >
                <div className="text-2xl mb-1">{feature.icon}</div>
                <div className={cn(
                  "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  feature.color
                )}>{feature.value}</div>
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
