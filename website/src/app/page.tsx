"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Contrast,
  Crop,
  Globe,
  Layers,
  Loader2,
  Maximize2,
  Palette,
  Scissors,
  ShieldCheck,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { AppLayout } from "@/components/app-layout";
import { DemoRevealSlider } from "@/components/demo-reveal-slider";
import { Typewriter } from "@/components/typewriter";
import { useImages } from "@/contexts/ImageContext";
import { cn } from "@/lib/utils";
import { mainsample, StockSample, stockSamples, stocksamples2 } from "@/lib/stock-samples";
import { adjust, bgblur, bgremove, bgreplace, crop, resize } from "@/lib/demo-smaples";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image with AI precision.",
    badge: "Core",
    href: "/remover",
    accent: "text-sky-300",
    glow: "from-sky-500/20",
    demo_image: bgremove
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize images for storefronts, socials, and profiles without extra setup.",
    badge: "Popular",
    href: "/resize",
    accent: "text-violet-300",
    glow: "from-violet-500/20",
    demo_image: resize
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Swap transparent cutouts onto clean colors, gradients, or images.",
    badge: "New",
    href: "/replace-bg",
    accent: "text-emerald-300",
    glow: "from-emerald-500/20",
    demo_image: bgreplace
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Create depth and focus with soft, realistic background blur.",
    badge: null,
    href: "/blur-bg",
    accent: "text-rose-300",
    glow: "from-rose-500/20",
    demo_image: bgblur
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Frame images for ads, marketplaces, and social ratios in seconds.",
    badge: null,
    href: "/crop",
    accent: "text-lime-300",
    glow: "from-lime-500/20",
    demo_image: crop
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Fine-tune brightness, contrast, and saturation before export.",
    badge: null,
    href: "/adjust",
    accent: "text-cyan-300",
    glow: "from-cyan-500/20",
    demo_image: adjust
  },
];

const trustStats = [
  { label: "No signup", value: "Free" },
  { label: "Batch ready", value: "Multi" },
  { label: "Export format", value: "PNG" },
  { label: "Resolution", value: "Full" },
];

const launchTags = [
  "Ecommerce",
  "Marketplace",
  "Ads",
  "Social",
  "Portfolio",
  "Agency",
  "Bulk Workflows",
];

const showcaseSlides = [
  {
    id: "product-shot",
    title: "Catalog Pack",
    description: "Clean marketplace-ready product imagery with fast cutouts.",
    tag: "Ecommerce",
    image: mainsample[0].image,
  },
  {
    id: "portrait-shot",
    title: "Social Portrait",
    description: "Creator and profile imagery that feels polished on every upload.",
    tag: "Social",
    image: mainsample[2].image,
  },
  {
    id: "creative-shot",
    title: "Quick Export",
    description: "Transparent PNGs ready for branding, ads, and thumbnails.",
    tag: "Branding",
    image: mainsample[4].image,
  },
  {
    id: "anime-shot",
    title: "Creative Cutout",
    description: "Stylized samples for portfolios and creative campaigns.",
    tag: "Portfolio",
    image: mainsample[3].image,
  },
];

const heroNotes = [
  "Transparent PNG output",
  "Original quality preserved",
  "Works with portraits, products, pets, and artwork",
];

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { images, addImages } = useImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);

  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.72, ease: "easeOut" as const };

  useEffect(() => {
    if (prefersReducedMotion || showcaseSlides.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveShowcaseIndex((current) => (current + 1) % showcaseSlides.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [prefersReducedMotion]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        addImages(files);
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

  const handleDropZoneDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDropActive(false);

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
      if (files.length > 0) {
        addImages(files);
        router.push("/remover");
      }
    },
    [addImages, router]
  );

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

      <div className="landing-shell premium-grid relative isolate overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_78%_10%,rgba(167,139,250,0.18),transparent_26%),radial-gradient(circle_at_70%_82%,rgba(132,204,22,0.12),transparent_24%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute left-1/2 top-0 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />

        <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-14">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTransition}
            className="relative z-10 max-w-3xl text-center lg:text-left"
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur lg:mx-0">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,0.75)]" />
              Free AI background removal for clean product-ready images
            </div>

            <h1 className="text-3xl font-semibold leading-[1.1] tracking-normal text-white sm:text-4xl lg:text-5xl xl:text-7xl min-h-[6rem] sm:min-h-[7rem] lg:min-h-[8.5rem]">
              <Typewriter
                staticText="Remove backgrounds with "
                phrases={[
                  { text: "high precision.", color: "#7C4DFF", speed: 80 },
                  { text: "studio speed.", color: "#FF6B6B", speed: 75 },
                  { text: "no limit.", color: "#00C853", speed: 80 },
                  { text: "AI tools.", color: "#00B4D8", speed: 80 },
                  { text: "full privacy.", color: "#1976D2", speed: 85 },
                ]}
                loopDelay={2500}
              />
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg lg:mx-0">
              QuickBG removes backgrounds, keeps the original resolution, and sends every upload straight into an editor built for fast exports. No signup, no credit card, no watermark.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_18px_70px_-22px_rgba(255,255,255,0.72)] transition duration-300 hover:-translate-y-0.5 hover:bg-lime-200 sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                Upload image
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <Link
                href="/tools"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white/80 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] sm:w-auto"
              >
                Browse tools
                <Globe className="h-4 w-4 text-sky-300" />
              </Link>
            </div>

            <div className="mt-7 grid gap-2 text-left sm:grid-cols-3">
              {heroNotes.map((note) => (
                <div key={note} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs text-white/60 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-300" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="relative min-h-[34rem] lg:min-h-[42rem]"
          >
            <div className="absolute left-4 top-6 hidden rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 shadow-2xl backdrop-blur md:flex">
              AI mask detected
            </div>
            <div className="absolute right-6 top-2 z-20 hidden rotate-3 rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur md:block">
              <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                <ShieldCheck className="h-4 w-4 text-lime-300" />
                Full resolution
              </div>
            </div>
            <div className="absolute -left-4 bottom-14 z-20 hidden -rotate-6 rounded-[1.5rem] border border-white/10 bg-[#111]/80 p-3 shadow-[0_32px_100px_-44px_rgba(0,0,0,0.9)] backdrop-blur md:block">
              <div className="relative h-28 w-40 overflow-hidden rounded-2xl">
                <Image
                  src={mainsample[1].image}
                  alt="Photo Shot"
                  fill
                  sizes="160px"
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
              <div className="mt-3 text-xs font-semibold text-white">Memes Ready Images</div>
              <div className="text-[11px] text-white/50">Maza nahi aa raha hai</div>
            </div>
            <div className="absolute bottom-6 right-0 z-20 hidden rotate-6 rounded-[1.5rem] border border-white/10 bg-[#111]/80 p-3 shadow-[0_32px_100px_-44px_rgba(0,0,0,0.9)] backdrop-blur sm:block">
              <div className="grid grid-cols-2 gap-2">
                {stocksamples2.slice(0, 4).map((sample) => (
                  <div key={sample.id} className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/5">
                    <Image
                      src={sample.image}
                      alt={`${sample.label} preview`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      placeholder="blur"
                    />
                  </div>
                ))}
              </div>
            </div>

            <DemoRevealSlider />
          </motion.div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-4 border-y border-white/10 py-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustStats.map((stat) => (
              <div key={stat.label} className="flex items-end justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div className="text-sm text-white/50">{stat.label}</div>
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDropZoneDragEnter}
            onDragLeave={handleDropZoneDragLeave}
            onDragOver={handleDropZoneDragOver}
            onDrop={handleDropZoneDrop}
            className="group mx-auto mt-16 w-full max-w-4xl cursor-pointer"
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-[2rem] border border-dashed p-1 transition duration-300",
                isDropActive
                  ? "border-lime-300/70 bg-lime-300/10"
                  : "border-white/20 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.06]"
              )}
              data-drop-zone
            >
              <div className="premium-glass relative rounded-[1.75rem] px-6 py-8 text-center sm:px-10 sm:py-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_42%)]" />
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white text-black shadow-[0_20px_80px_-32px_rgba(255,255,255,0.8)]">
                  <Upload className="h-7 w-7" />
                </div>
                <h2 className="relative text-2xl font-semibold tracking-normal text-white sm:text-3xl">
                  Drop images here or click to upload
                </h2>
                <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
                  Batch upload is supported. QuickBG sends your images to the remover and exports transparent PNG results.
                </p>
                <div className="relative mt-6 flex flex-wrap justify-center gap-2 text-xs text-white/60">
                  {["PNG", "JPG", "WebP", "HEIC", "AVIF"].map((format) => (
                    <span key={format} className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {hasImages && (
            <div className="mt-8 text-center">
              <Link href="/remover" className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200">
                View {images.length} processing image{images.length !== 1 ? "s" : ""}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-20"
          >
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Live samples</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Try the real remover flow.</h2>
              </div>
              {loadingSampleId && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading sample
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stockSamples.map((sample, index) => (
                <motion.button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSampleSelect(sample)}
                  disabled={!!loadingSampleId}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] text-left shadow-[0_24px_80px_-52px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] disabled:pointer-events-none disabled:opacity-70"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                    <Image
                      src={sample.image}
                      alt={`${sample.label} sample`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      placeholder="blur"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{sample.label}</p>
                      <p className="truncate text-xs text-white/50">{sample.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-sky-300">
                      Try
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Image toolkit</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Everything stays close to the upload.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Keep moving from cutout to crop, resize, replace, blur, and adjustment without leaving the QuickBG workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 relative">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
                  onClick={(e) => {
                    if (tool.id === "remove-bg" && !hasImages) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition duration-300 group-hover:opacity-100", tool.glow)} />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30", tool.accent)}>
                      <tool.icon className="h-5 w-5" />
                    </div>
                    {tool.badge && (
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/60">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="relative mt-5 text-base font-semibold text-white">{tool.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-white/50 max-w-[200px] max-md:max-w-[180px]">{tool.description}</p>
                  <div className="relative mt-5 inline-flex items-center gap-2 text-xs font-medium text-white/60 transition group-hover:text-white">
                    Open tool
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                  <div className="hover:-bottom-2 hover:-right-4 absolute -right-5 -bottom-3 z-20 -rotate-12 rounded-[1.5rem] border border-white/10 bg-[#111]/80 p-1 shadow-[0_32px_100px_-44px_rgba(0,0,0,0.9)] backdrop-blur transition-all">
                    <div className="relative h-44 w-44 overflow-hidden rounded-2xl">
                      <Image
                        src={tool.demo_image}
                        alt="Photo Shot"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          <div className="mt-24 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-3 sm:p-6">
            {[
              { icon: Wand2, label: "AI cutouts", value: "Fast subject masks" },
              { icon: ShieldCheck, label: "Private by design", value: "No account required" },
              { icon: Zap, label: "Export-ready", value: "Transparent PNGs" },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5">
                <item.icon className="h-5 w-5 text-lime-300" />
                <div className="mt-4 text-sm font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-sm text-white/50">{item.value}</div>
              </div>
            ))}
          </div>

          <section className="relative mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-black/35 px-6 py-10 sm:px-8 lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(56,189,248,0.14),transparent_42%),radial-gradient(circle_at_78%_80%,rgba(163,230,53,0.1),transparent_36%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Website ideas your users can see</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                  Showcase real use cases without repeating the main upload CTA.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">
                  This section works as a visual examples block for storefronts, agencies, creators, and ecommerce workflows. It adds context after the user has already seen the main action.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {launchTags.map((tag, index) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium",
                        index % 3 === 0 && "border-sky-300/35 bg-sky-300/10 text-sky-200",
                        index % 3 === 1 && "border-lime-300/30 bg-lime-300/10 text-lime-200",
                        index % 3 === 2 && "border-white/15 bg-white/5 text-white/70"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_18px_70px_-22px_rgba(255,255,255,0.72)] transition duration-300 hover:-translate-y-0.5 hover:bg-lime-200 sm:w-auto"
                  >
                    Upload and start
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <Link
                    href="/tools"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.08]"
                  >
                    Explore all tools
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[32rem] sm:h-[25rem]">
                <div className="relative h-[23rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/60 p-3 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.95)] backdrop-blur sm:h-[25rem]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(163,230,53,0.08),transparent_36%)]" />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showcaseSlides[activeShowcaseIndex].id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10, scale: 0.985 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="relative z-10 h-full"
                    >
                      <div className="relative h-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/5">
                        <Image
                          src={showcaseSlides[activeShowcaseIndex].image}
                          alt={showcaseSlides[activeShowcaseIndex].title}
                          fill
                          className="object-cover"
                          placeholder="blur"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={showcaseSlides[activeShowcaseIndex].tag}
                              initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                              exit={prefersReducedMotion ? undefined : { opacity: 0, x: 8 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur"
                            >
                              {showcaseSlides[activeShowcaseIndex].tag}
                            </motion.span>
                          </AnimatePresence>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={showcaseSlides[activeShowcaseIndex].title}
                              initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
                              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -8 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-medium text-white/65 backdrop-blur"
                            >
                              {showcaseSlides[activeShowcaseIndex].title}
                            </motion.span>
                          </AnimatePresence>
                        </div>

                        {/* caption moved outside the animated image div so the outer card stays fixed */}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {/* Fixed caption panel: stays visually anchored while inner text updates */}
                  <div className="absolute bottom-2 p-4 sm:p-5 z-20">
                    <div className="max-w-md rounded-[1.2rem] border border-white/10 bg-black/55 p-4 backdrop-blur">
                      <div className="flex items-start justify-between gap-3">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={showcaseSlides[activeShowcaseIndex].id}
                            initial={prefersReducedMotion ? false : { opacity: 0, x: 14 }}
                            animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                            exit={prefersReducedMotion ? undefined : { opacity: 0, x: -14 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="min-w-0"
                          >
                            <h3 className="text-lg font-semibold text-white sm:text-xl">
                              {showcaseSlides[activeShowcaseIndex].title}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-white/60">
                              {showcaseSlides[activeShowcaseIndex].description}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <div className="mt-4 flex gap-2">
                        {showcaseSlides.map((slide, index) => (
                          <button
                            key={slide.id}
                            type="button"
                            onClick={() => setActiveShowcaseIndex(index)}
                            className={cn(
                              "h-2.5 rounded-full transition-all duration-300",
                              index === activeShowcaseIndex ? "w-8 bg-white" : "w-2.5 bg-white/35 hover:bg-white/60"
                            )}
                            aria-label={`Show ${slide.title}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </section>
      </div>
    </AppLayout>
  );
}
