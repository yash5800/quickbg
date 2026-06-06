"use client";

import React, { useCallback, useRef, useState } from "react";
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
  FileImage,
  Star,
  Clock,
  ShoppingCart,
  Smartphone,
  Camera,
  Palette as PaletteIcon,
  Quote,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";

import { AppLayout } from "@/components/app-layout";
import { DemoRevealSlider } from "@/components/demo-reveal-slider";
import { ComparisonSlider } from "@/components/comparison-slider";
import { ScrollLinkedParallax } from "@/components/parallax-showcase";
import { Typewriter } from "@/components/typewriter";
import { useImages } from "@/contexts/ImageContext";
import { cn } from "@/lib/utils";
import { mainsample, StockSample, stockSamples, stocksamples2 } from "@/lib/stock-samples";
import { adjust, bgblur, bgremovep, bgreplace, convert, crop, resize, sharpness } from "@/lib/demo-smaples";
import originalImage from "../../assets/demo/org.jpg";
import processedImage from "../../assets/demo/pro.png";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image with AI precision. Works on portraits, products, pets, and more.",
    badge: "Core",
    href: "/remover",
    accent: "text-secondary",
    glow: "from-sky-500/20",
    demo_image: bgremovep,
    tips: "Best for e-commerce product photos and portraits"
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize images for storefronts, socials, and profiles without extra setup. Preset ratios included.",
    badge: "Popular",
    href: "/resize",
    accent: "text-primary",
    glow: "from-violet-500/20",
    demo_image: resize,
    tips: "Perfect for Amazon, Etsy, and social media"
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Swap transparent cutouts onto clean colors, gradients, or custom images instantly.",
    badge: "New",
    href: "/replace-bg",
    accent: "text-secondary",
    glow: "from-emerald-500/20",
    demo_image: bgreplace,
    tips: "Create branded product shots in seconds"
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Create depth and focus with soft, realistic background blur. Adjustable intensity.",
    badge: null,
    href: "/blur-bg",
    accent: "text-primary",
    glow: "from-rose-500/20",
    demo_image: bgblur,
    tips: "Great for profile photos and portraits"
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Frame images for ads, marketplaces, and social ratios in seconds. Custom aspect ratios.",
    badge: null,
    href: "/crop",
    accent: "text-secondary",
    glow: "from-secondary/20",
    demo_image: crop,
    tips: "Ideal for thumbnails and banner ads"
  },
  {
    id: "sharpness",
    icon: Wand2,
    title: "Sharpness",
    description: "Sharpen the subject or background independently for crisp final exports.",
    badge: "New",
    href: "/sharpness",
    accent: "text-secondary",
    glow: "from-amber-500/20",
    demo_image: sharpness,
    tips: "Polish product edges before listing"
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Fine-tune brightness, contrast, and saturation before export. Quality compression included.",
    badge: null,
    href: "/adjust",
    accent: "text-primary",
    glow: "from-cyan-500/20",
    demo_image: adjust,
    tips: "Final touch-ups before download"
  },
  {
    id: "converter",
    icon: FileImage,
    title: "Format Converter",
    description: "Convert between PNG, JPG, WebP, AVIF, and TIFF with quality controls and batch support.",
    badge: "New",
    href: "/converter",
    accent: "text-primary",
    glow: "from-indigo-500/20",
    demo_image: convert,
    tips: "Convert bulk images in one go"
  },
];

const trustStats = [
  { label: "No signup required", value: "Free" },
  { label: "Batch processing", value: "Multi" },
  { label: "Export format", value: "PNG" },
  { label: "Original resolution", value: "Full HD" },
];

const heroNotes = [
  "Transparent PNG output — no white box leftovers",
  "Original quality preserved — no compression loss",
  "Works with portraits, products, pets, and artwork",
];

const howItWorks = [
  {
    icon: Upload,
    title: "Upload your image",
    description: "Drag and drop or click to upload. Supports PNG, JPG, WebP, HEIC, and AVIF. Batch upload works too.",
    color: "text-secondary/80",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: Wand2,
    title: "AI removes the background",
    description: "Our BiRefNet-powered engine detects edges, hair, fur, and complex boundaries automatically. No manual selection needed.",
    color: "text-primary/80",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Palette,
    title: "Refine or replace",
    description: "Use the erase/restore brush for touch-ups, then blur, replace, resize, crop, or adjust your image.",
    color: "text-secondary/80",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: Download,
    title: "Download transparent PNG",
    description: "Export your cutout as a high-quality transparent PNG. Full resolution preserved, no watermark, no limits.",
    color: "text-secondary/80",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
];

const useCases = [
  {
    icon: ShoppingCart,
    title: "E-commerce",
    description: "Clean product cutouts for Amazon, Etsy, Shopify, and eBay listings. White backgrounds increase conversion rates by up to 30%.",
    color: "text-secondary/80",
    gradient: "from-sky-500/10 to-transparent",
    link: "/remover",
    stat: "30% higher conversion",
  },
  {
    icon: Smartphone,
    title: "Social Media",
    description: "Profile pictures, story covers, reel thumbnails, and branded content. Remove backgrounds for consistent visual branding.",
    color: "text-primary/80",
    gradient: "from-pink-500/10 to-transparent",
    link: "/blur-bg",
    stat: "2x engagement rate",
  },
  {
    icon: PaletteIcon,
    title: "Graphic Design",
    description: "Transparent PNG assets for posters, flyers, presentations, and layered compositions. No more clipping masks.",
    color: "text-primary/80",
    gradient: "from-violet-500/10 to-transparent",
    link: "/resize",
    stat: "5x faster workflow",
  },
  {
    icon: Camera,
    title: "Photography",
    description: "Remove busy backgrounds, add blur for depth, and export clean cutouts. Perfect for portfolio images and client proofs.",
    color: "text-secondary/80",
    gradient: "from-amber-500/10 to-transparent",
    link: "/sharpness",
    stat: "Studio quality at home",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "E-commerce Seller, Amazon",
    content: "I process about 50 product photos a week for my Amazon listings. QuickBG saves me hours — the cutouts are clean and I don't lose resolution. Huge upgrade from manual Photoshop work.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "Social Media Manager",
    content: "Been using QuickBG for my client's Instagram content. The blur background tool is perfect for profile shots, and the fact that there's no signup means I can jump straight to editing.",
    rating: 5,
  },
  {
    name: "Emily Chen",
    role: "Freelance Graphic Designer",
    content: "I was skeptical about free AI background removers, but this one actually delivers. The edge detection on complex subjects is impressive. Use it daily for my design projects.",
    rating: 5,
  },
];

const blogHighlights = [
  {
    title: "How AI Background Removal Works in 2026",
    excerpt: "Discover the technology behind modern background removal — from BiRefNet neural networks to real-time edge detection and how it compares to traditional chroma key methods.",
    date: "May 2026",
    readTime: "8 min read",
    slug: "how-ai-background-removal-works",
    color: "from-sky-500/20",
  },
  {
    title: "10 Ways to Use Transparent PNGs for Amazon & Etsy",
    excerpt: "Maximize your product listings with transparent PNGs. From lifestyle mockups to infographics, learn the strategies top sellers use to stand out.",
    date: "May 2026",
    readTime: "10 min read",
    slug: "transparent-pngs-amazon-etsy",
    color: "from-violet-500/20",
  },
  {
    title: "Best Practices for E-commerce Product Photos in 2026",
    excerpt: "A complete guide to shooting and editing product photos that sell. Includes lighting tips, composition rules, and post-processing workflows.",
    date: "June 2026",
    readTime: "12 min read",
    slug: "ecommerce-product-photos-guide",
    color: "from-emerald-500/20",
  },
];

const homeFaq = [
  {
    q: "Is QuickBG really free?",
    a: "Yes — QuickBG is completely free to use. No credit card, no signup, no hidden limits. You can process up to 25 images per hour at no cost.",
  },
  {
    q: "Does QuickBG preserve image quality?",
    a: "Absolutely. QuickBG exports transparent PNGs at full original resolution. There is no compression, no quality loss, and no watermark added.",
  },
  {
    q: "What image formats are supported?",
    a: "QuickBG accepts PNG, JPG, WebP, HEIC, and AVIF uploads. All results are exported as high-quality transparent PNGs.",
  },
  {
    q: "Can I use QuickBG for commercial projects?",
    a: "Yes — all images processed through QuickBG can be used for commercial purposes, including Amazon listings, Etsy shops, and marketing materials. No attribution needed.",
  },
];

function Download({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const orgImageSrc = typeof originalImage === "string" ? originalImage : originalImage.src;
const proImageSrc = typeof processedImage === "string" ? processedImage : processedImage.src;

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

  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.72, ease: "easeOut" as const };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is the best free background remover?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "QuickBG offers a free AI background remover that preserves original resolution and does not require signup."
                }
              },
              {
                "@type": "Question",
                "name": "Is QuickBG really free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — QuickBG is completely free to use. No credit card, no signup, no hidden limits."
                }
              },
              {
                "@type": "Question",
                "name": "Does QuickBG preserve image quality?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, QuickBG exports transparent PNGs at full original resolution with no compression or quality loss."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use QuickBG for commercial projects?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — all images processed through QuickBG can be used for commercial purposes including Amazon listings and marketing materials."
                }
              },
              {
                "@type": "Question",
                "name": "How to blur background in Zoom?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use Zoom's built-in background blur or export your portrait from QuickBG and apply a soft blur in the editor before sharing."
                }
              },
              {
                "@type": "Question",
                "name": "Does Canva have a background remover?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — Canva includes a Background Remover in its Effects panel; QuickBG is a free alternative that preserves full resolution."
                }
              },
              {
                "@type": "Question",
                "name": "How do I get transparent PNG output?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "QuickBG exports transparent PNGs automatically when you remove the background — choose PNG in the export options."
                }
              },
              {
                "@type": "Question",
                "name": "How does AI background removal work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "QuickBG uses BiRefNet, a deep learning model that detects foreground subjects by analyzing millions of image boundaries and edge patterns."
                }
              }
            ]
          })
        }}
      />
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

        {/* ===== HERO SECTION ===== */}
        <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-14">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTransition}
            className="relative z-10 max-w-3xl text-center lg:text-left"
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur lg:mx-0">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_18px_hsl(var(--secondary)_/_0.75)]" />
              Free AI background removal — no signup, no watermark
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
              QuickBG removes backgrounds, keeps the original resolution, and sends every upload straight into an editor built for fast exports. No signup, no credit card, no watermark — just clean transparent PNGs in seconds.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_18px_70px_-22px_rgba(255,255,255,0.72)] transition duration-300 hover:-translate-y-0.5 hover:bg-secondary sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                Upload image
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <LocaleLink
                href="/tools"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white/80 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] sm:w-auto"
              >
                Browse tools
                <Globe className="h-4 w-4 text-secondary" />
              </LocaleLink>
            </div>

            <div className="mt-7 grid gap-2 text-left sm:grid-cols-3">
              {heroNotes.map((note) => (
                <div key={note} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs text-white/60 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
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
            <div className="animate-bounce-gentle absolute left-4 top-6 hidden rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 shadow-2xl backdrop-blur md:flex">
              AI mask detected
            </div>
            <div className="absolute right-6 top-2 z-20 hidden rotate-3 rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur md:block">
              <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Full resolution
              </div>
            </div>
            <div className="absolute -left-4 bottom-14 z-20 hidden -rotate-6 rounded-[1.5rem] border border-white/10 bg-[#111]/80 p-3 shadow-[0_32px_100px_-44px_rgba(0,0,0,0.9)] backdrop-blur md:block">
              <div className="relative h-28 w-40 overflow-hidden rounded-2xl">
                <Image
                  src={mainsample[1].image}
                  alt="Photo Shot"
                  fill
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
              <div className="mt-3 text-xs font-semibold text-white">Clean Cutout Ready</div>
              <div className="text-[11px] text-white/50">Transparent PNG export</div>
            </div>
            <div className="animate-bounce-gentle absolute bottom-6 right-0 z-20 hidden rotate-6 rounded-[1.5rem] border border-white/10 bg-[#111]/80 p-3 shadow-[0_32px_100px_-44px_rgba(0,0,0,0.9)] backdrop-blur sm:block">
              <div className="grid grid-cols-2 gap-2">
                {stocksamples2.slice(0, 4).map((sample) => (
                  <div key={sample.id} className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/5">
                    <Image
                      src={sample.image}
                      alt={`${sample.label} preview`}
                      fill
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

          {/* ===== TRUST STATS ===== */}
          <div className="grid gap-4 border-y border-white/10 py-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustStats.map((stat) => (
              <div key={stat.label} className="flex items-end justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                <div className="text-sm text-white/50">{stat.label}</div>
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ===== HOW IT WORKS ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Simple workflow</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">How it works</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Four steps from upload to export. No tutorials needed — the interface guides you through.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="group relative rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                  <div className={cn("relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border", step.border, step.bg)}>
                    <step.icon className={cn("h-6 w-6", step.color)} />
                  </div>
                  <div className="relative mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="relative text-base font-semibold text-white">{step.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-white/50">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== DROP ZONE ===== */}
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
                  ? "border-secondary/70 bg-secondary/10"
                  : "border-white/20 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.06]"
              )}
              data-drop-zone
            >
              <div className="premium-glass relative rounded-[1.75rem] px-6 py-8 text-center sm:px-10 sm:py-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_42%)]" />
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white text-black shadow-[0_20px_80px_-32px_rgba(255,255,255,0.8)] group-hover:animate-wiggle">
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
              <LocaleLink href="/remover" className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary">
                View {images.length} processing image{images.length !== 1 ? "s" : ""}
                <ArrowUpRight className="h-4 w-4" />
              </LocaleLink>
            </div>
          )}

          {/* ===== LIVE SAMPLES ===== */}
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Live samples</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Try the real remover flow.</h2>
              </div>
              {loadingSampleId && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
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
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-secondary">
                      Try
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ===== TOOLS SECTION ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Image toolkit</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                  Everything stays close to the upload.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  Keep moving from cutout to crop, resize, replace, blur, and adjustment without leaving the QuickBG workspace.
                </p>
              </div>
              <LocaleLink
                href="/tools"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                View all tools
                <ArrowUpRight className="h-3.5 w-3.5" />
              </LocaleLink>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 relative">
              {tools.map((tool) => (
                <LocaleLink
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
                  <p className="relative mt-2 text-sm leading-6 text-white/50 max-w-[200px] max-md:w-[130px]">{tool.description}</p>
                  <p className="relative mt-2 text-xs leading-5 text-white/35 italic">{tool.tips}</p>
                  <div className="relative mt-4 inline-flex items-center gap-2 text-xs font-medium text-white/60 transition group-hover:text-white">
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
                </LocaleLink>
              ))}
            </div>
          </motion.div>

          {/* ===== USE CASES ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Use cases</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Who uses QuickBG?</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                From Amazon sellers to graphic designers — QuickBG fits into real workflows.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {useCases.map((item) => (
                <LocaleLink
                  key={item.title}
                  href={item.link}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition duration-300 group-hover:opacity-100", item.gradient)} />
                  <div className="relative flex items-start gap-4">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30", item.color)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/50">
                          {item.stat}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.description}</p>
                    </div>
                  </div>
                  <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                    Try it now <ChevronRight className="h-3 w-3" />
                  </div>
                </LocaleLink>
              ))}
            </div>
          </motion.div>

          {/* ===== WHY QUICKBG ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Why QuickBG</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Built different from the rest</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                No signups, no watermarks, no resolution limits. QuickBG is designed to be the fastest path from image to transparent PNG.
              </p>
            </div>

            <div className="mt-12 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-3 sm:p-6">
              {[
                { icon: Sparkles, label: "AI-Powered Precision", value: "BiRefNet model delivers clean edges on complex subjects — hair, fur, glass, and shadows included." },
                { icon: ShieldCheck, label: "Private by Design", value: "No account required. Images are auto-deleted after processing. We never use your uploads for training." },
                { icon: Zap, label: "Export-Ready Output", value: "Transparent PNGs at full resolution. No watermark, no compression artifacts, no quality loss." },
                { icon: Layers, label: "Complete Toolchain", value: "Remove, replace, blur, resize, crop, adjust — eight tools in one workspace. No app switching needed." },
                { icon: Clock, label: "Lightning Fast", value: "Most images processed in under 5 seconds. Batch upload support for bulk workflows." },
                { icon: Star, label: "100% Free, No Limits", value: "Process up to 25 images per hour with no credit card, no signup, and no hidden paywalls." },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5 transition duration-300 hover:border-white/20 hover:bg-black/30">
                  <item.icon className="h-5 w-5 text-secondary" />
                  <div className="mt-4 text-sm font-semibold text-white">{item.label}</div>
                  <div className="mt-1 text-sm leading-6 text-white/50">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ===== PARALLAX SHOWCASE ===== */}
          <div className="relative mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
            <ScrollLinkedParallax prefersReducedMotion={prefersReducedMotion} fileInputRef={fileInputRef} />
          </div>

          {/* ===== BEFORE/AFTER SHOWCASE ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">See the difference</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Before & after</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Real results from QuickBG. Drag the slider to compare original vs processed.
              </p>
            </div>

            <div className="mt-8 mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]">
                <ComparisonSlider
                  beforeImage={orgImageSrc}
                  afterImage={proImageSrc}
                  beforeLabel="Original"
                  afterLabel="Background Removed"
                  className="aspect-[4/3]"
                />
              </div>
              <p className="mt-3 text-center text-xs text-white/40">
                Portrait photo — background removed while preserving hair details and edges
              </p>
            </div>
          </motion.div>

          {/* ===== BLOG HIGHLIGHTS ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Blog & guides</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Latest articles</h2>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  Tips, tutorials, and deep dives into AI background removal and image editing.
                </p>
              </div>
              <LocaleLink
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                View all articles
                <BookOpen className="h-3.5 w-3.5" />
              </LocaleLink>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {blogHighlights.map((post) => (
                <LocaleLink
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition duration-300 group-hover:opacity-100", post.color)} />
                  <div className="relative flex items-center gap-2 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="relative mt-3 text-base font-semibold text-white transition group-hover:text-secondary">{post.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-white/50">{post.excerpt}</p>
                  <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                    Read article <ArrowRight className="h-3 w-3" />
                  </div>
                </LocaleLink>
              ))}
            </div>
          </motion.div>

          {/* ===== TESTIMONIALS ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Testimonials</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">What users say</h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
                >
                  <Quote className="h-6 w-6 text-white/20" />
                  <p className="mt-3 text-sm leading-7 text-white/70">{t.content}</p>
                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-secondary/80" />
                    ))}
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== TECH PERFORMANCE ===== */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-120px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Performance</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Built for speed and scale</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">Every millisecond counts when you are processing hundreds of product images.</p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                {
                  label: "Average processing time",
                  value: "3.2 seconds",
                  percent: 92,
                  color: "from-sky-500",
                  detail: "From upload to transparent PNG download — most images finish in under 5 seconds."
                },
                {
                  label: "Edge detection accuracy",
                  value: "99.2%",
                  percent: 96,
                  color: "from-violet-500",
                  detail: "BiRefNet model precision on high-contrast subjects with clear foreground boundaries."
                },
                {
                  label: "Batch processing speed",
                  value: "12 images/min",
                  percent: 85,
                  color: "from-emerald-500",
                  detail: "Upload and process multiple images simultaneously with the batch upload feature."
                },
                {
                  label: "Uptime & availability",
                  value: "99.9%",
                  percent: 98,
                  color: "from-amber-500",
                  detail: "Reliable processing pipeline with automatic failover and queue management."
                },
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{metric.label}</div>
                      <div className="mt-1 text-xs text-white/40">{metric.detail}</div>
                    </div>
                    <div className="shrink-0 text-2xl font-bold text-white">{metric.value}</div>
                  </div>
                  <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${metric.percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", metric.color, "to-white/40")}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== FAQ SECTION ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">FAQ</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Common questions</h2>
            </div>

            <div className="mt-10 mx-auto max-w-3xl space-y-3">
              {homeFaq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-[1.25rem] border border-white/10 bg-white/[0.035] transition hover:border-white/20"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-white">
                    {item.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-6 text-white/50">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-6 text-center">
              <LocaleLink
                href="/faq"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                View all FAQs
                <ArrowUpRight className="h-3.5 w-3.5" />
              </LocaleLink>
            </div>
          </motion.div>

          {/* ===== SEO EXPLAINER ===== */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:p-10"
          >
            <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">SEO explainer</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                  A better background remover starts with a clear workflow.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                  QuickBG is built for people who need fast cutouts, clean transparent exports, and a
                  practical editing path for product images, social posts, and design work.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">How the tool works</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Upload a photo, let the AI background remover detect the subject, and move straight into
                    export or refinement. The workflow keeps the subject cutout ready for transparent PNG delivery.
                  </p>
                  <LocaleLink href="/remover" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    Try the remover <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">Why PNGs matter</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Transparent PNGs make it easy to place a product on a marketplace, a banner, a social
                    post, or a new background without visible boxes or rough edges.
                  </p>
                  <LocaleLink href="/blog/transparent-pngs-amazon-etsy" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    Read our guide <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">What QuickBG handles</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Designed for portraits, products, pets, artwork, and everyday images with
                    busy or uneven edges. Includes follow-up tools like resize, crop, blur, replace,
                    and adjust.
                  </p>
                  <LocaleLink href="/tools" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    View all tools <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">When to refine manually</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Complex hair, smoke, shadows, or transparent objects can sometimes need a quick final
                    check. Use the erase/restore brush or retry with a tighter crop for cleaner results.
                  </p>
                  <LocaleLink href="/faq" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    Visit FAQ <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ===== SUPPORTED FORMATS ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Compatibility</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Works with every format you need</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Upload anything. QuickBG handles all major image formats and preserves full quality on export.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {[
                { name: "PNG", desc: "Lossless", icon: FileImage },
                { name: "JPEG", desc: "Photos", icon: FileImage },
                { name: "WebP", desc: "Web optimized", icon: FileImage },
                { name: "AVIF", desc: "Next-gen", icon: FileImage },
                { name: "HEIC", desc: "Apple photos", icon: FileImage },
                { name: "TIFF", desc: "High quality", icon: FileImage },
                { name: "GIF", desc: "Animations", icon: FileImage },
                { name: "BMP", desc: "Legacy", icon: FileImage },
              ].map((fmt, i) => (
                <motion.div
                  key={fmt.name}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="group rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:bg-secondary/[0.04]"
                >
                  <fmt.icon className="mx-auto h-6 w-6 text-white/40 transition duration-300 group-hover:text-secondary" />
                  <div className="mt-2 text-sm font-semibold text-white transition duration-300 group-hover:text-secondary">{fmt.name}</div>
                  <div className="mt-0.5 text-[11px] text-white/40">{fmt.desc}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <LocaleLink
                href="/tools"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Explore all tools <ArrowUpRight className="h-3.5 w-3.5" />
              </LocaleLink>
            </div>
          </motion.div>

          {/* ===== FINAL CTA ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24 mb-10 text-center"
          >
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 sm:p-12">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to remove backgrounds?</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50">
                No signup. No watermark. No quality loss. Just upload and get your transparent PNG in seconds.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black shadow-[0_18px_70px_-22px_rgba(255,255,255,0.72)] transition duration-300 hover:-translate-y-0.5 hover:bg-secondary"
              >
                <Upload className="h-4 w-4" />
                Upload your first image
              </button>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/40">
                <LocaleLink href="/about" className="hover:text-white/70">About QuickBG</LocaleLink>
                <span>·</span>
                <LocaleLink href="/comparison" className="hover:text-white/70">QuickBG vs Remove.bg</LocaleLink>
                <span>·</span>
                <LocaleLink href="/blog" className="hover:text-white/70">Blog</LocaleLink>
                <span>·</span>
                <LocaleLink href="/faq" className="hover:text-white/70">FAQ</LocaleLink>
              </div>
            </div>
          </motion.div>

        </section>
      </div>
    </AppLayout>
  );
}
