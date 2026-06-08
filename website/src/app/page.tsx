"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Globe,
  Layers,
  Loader2,
  ShieldCheck,
  Upload,
  Zap,
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
  FileImage,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { useLocale } from "@/contexts/LocaleContext";

import { AppLayout } from "@/components/app-layout";
import { DemoRevealSlider } from "@/components/demo-reveal-slider";
import { ComparisonSlider } from "@/components/comparison-slider";
import { ScrollLinkedParallax } from "@/components/parallax-showcase";
import { InteractiveToolPlayground } from "@/components/interactive-tool-playground";
import { Typewriter } from "@/components/typewriter";
import { useImages } from "@/contexts/ImageContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { mainsample, StockSample, stockSamples, stocksamples2 } from "@/lib/stock-samples";
import originalImage from "../../assets/demo/org2.jpg";
import processedImage from "../../assets/demo/pro2.png";

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
    slug: "how-ai-background-removal-works",
    date: "May 2026",
    readTime: "8 min read",
    color: "from-sky-500/20",
  },
  {
    slug: "transparent-pngs-amazon-etsy",
    date: "May 2026",
    readTime: "10 min read",
    color: "from-violet-500/20",
  },
  {
    slug: "ecommerce-product-photos-guide",
    date: "June 2026",
    readTime: "12 min read",
    color: "from-emerald-500/20",
  },
];

const orgImageSrc = typeof originalImage === "string" ? originalImage : originalImage.src;
const proImageSrc = typeof processedImage === "string" ? processedImage : processedImage.src;

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { images, addImages } = useImages();
  const { t } = useLocale();
  const heroNotes = [
    t("home.heroNotes.png"),
    t("home.heroNotes.quality"),
    t("home.heroNotes.works"),
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isDropActive, setIsDropActive] = useState(false);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const { addToast } = useToast();

  const motionTransition = { duration: 0.72, ease: "easeOut" as const };

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
        addToast({
          type: "error",
          title: "Failed to load sample",
          description: "Could not load the sample image. Please try again.",
          duration: 4000,
        });
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
              {t("home.badge")}
            </div>

            <h1 className="text-3xl font-semibold leading-[1.1] tracking-normal text-white sm:text-4xl lg:text-5xl xl:text-7xl min-h-[6rem] sm:min-h-[7rem] lg:min-h-[8.5rem]">
              <Typewriter
                staticText={t("home.typewriterStatic")}
                phrases={[
                  { text: t("home.typewriterPhrases.precision"), color: "#7C4DFF", speed: 80 },
                  { text: t("home.typewriterPhrases.speed"), color: "#FF6B6B", speed: 75 },
                  { text: t("home.typewriterPhrases.noLimit"), color: "#00C853", speed: 80 },
                  { text: t("home.typewriterPhrases.tools"), color: "#00B4D8", speed: 80 },
                  { text: t("home.typewriterPhrases.privacy"), color: "#1976D2", speed: 85 },
                ]}
                loopDelay={2500}
              />
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg lg:mx-0">
              {t("home.description")}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_18px_70px_-22px_rgba(255,255,255,0.72)] transition duration-300 hover:-translate-y-0.5 hover:bg-secondary sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {t("home.uploadImage")}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <LocaleLink
                href="/tools"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white/80 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] sm:w-auto"
              >
                {t("home.browseTools")}
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
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="relative min-h-[34rem] lg:min-h-[42rem]"
          >
            <div className="animate-bounce-gentle absolute left-4 top-6 hidden rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 shadow-2xl backdrop-blur md:flex">
              {t("home.aiMask")}
            </div>
            <div className="absolute right-6 top-2 z-20 hidden rotate-3 rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur md:block">
              <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                {t("home.fullRes")}
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
              <div className="mt-3 text-xs font-semibold text-white">{t("home.cleanCutout")}</div>
              <div className="text-[11px] text-white/50">{t("home.transparentExport")}</div>
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
            {(["signup", "batch", "format", "resolution"] as const).map((key) => {
              const valueKey = ({signup:"free", batch:"multi", format:"png", resolution:"hd"} as const)[key];
              return (
                <div key={key} className="flex items-end justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="text-sm text-white/50">{t(`home.trustStats.${key}`)}</div>
                  <div className="text-2xl font-semibold text-white">{t(`home.trustValues.${valueKey}`)}</div>
                </div>
              );
            })}
          </div>

          {/* ===== INTERACTIVE TOOL PLAYGROUND ===== */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            transition={motionTransition}
            className="mt-24"
          >
            <InteractiveToolPlayground />
          </motion.div>

          {/* ===== DROP ZONE ===== */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDropZoneDragEnter}
            onDragLeave={handleDropZoneDragLeave}
            onDragOver={handleDropZoneDragOver}
            onDrop={handleDropZoneDrop}
            className="group mx-auto mt-24 w-full max-w-4xl cursor-pointer"
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
                  {t("home.dropTitle")}
                </h2>
                <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
                  {t("home.dropDesc")}
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
                {t("home.viewProcessing").replace("{count}", String(images.length))}
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.liveSamples")}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.tryReal")}</h2>
              </div>
              {loadingSampleId && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("home.loadingSample")}
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
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.useCases")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.whoUses")}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                {t("home.whoUsesDesc")}
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
                        <h3 className="text-lg font-semibold text-white">{t(`home.useCaseTitles.${["ecommerce", "social", "design", "photo"][useCases.indexOf(item)]}`)}</h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/50">
                          {t(`home.useCaseStats.${["ecommerce", "social", "design", "photo"][useCases.indexOf(item)]}`)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/50">{t(`home.useCaseDescs.${["ecommerce", "social", "design", "photo"][useCases.indexOf(item)]}`)}</p>
                    </div>
                  </div>
                  <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                    {t("home.tryItNow")} <ChevronRight className="h-3 w-3" />
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.whyQuickbg")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.builtDifferent")}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                {t("home.builtDifferentDesc")}
              </p>
            </div>

            <div className="mt-12 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-3 sm:p-6">
              {(["precision", "private", "export", "toolchain", "fast", "free"] as const).map((key) => (
                <div key={key} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5 transition duration-300 hover:border-white/20 hover:bg-black/30">
                  {key === "precision" && <Sparkles className="h-5 w-5 text-secondary" />}
                  {key === "private" && <ShieldCheck className="h-5 w-5 text-secondary" />}
                  {key === "export" && <Zap className="h-5 w-5 text-secondary" />}
                  {key === "toolchain" && <Layers className="h-5 w-5 text-secondary" />}
                  {key === "fast" && <Clock className="h-5 w-5 text-secondary" />}
                  {key === "free" && <Star className="h-5 w-5 text-secondary" />}
                  <div className="mt-4 text-sm font-semibold text-white">{t(`home.whyItems.${key}`)}</div>
                  <div className="mt-1 text-sm leading-6 text-white/50">{t(`home.whyItems.${key}Desc`)}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ===== PARALLAX SHOWCASE ===== */}
          <div className="relative mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
            <ScrollLinkedParallax fileInputRef={fileInputRef} />
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.seeTheDifference")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.beforeAfter")}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                {t("home.beforeAfterDesc")}
              </p>
            </div>

            <div className="mt-8 mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]">
                <ComparisonSlider
                  beforeImage={orgImageSrc}
                  afterImage={proImageSrc}
                  beforeLabel={t("home.original")}
                  afterLabel={t("home.backgroundRemoved")}
                  className="aspect-[4/3]"
                />
              </div>
              <p className="mt-3 text-center text-xs text-white/40">
                {t("home.beforeAfterCaption")}
              </p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.seoExplainer")}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                  {t("home.seoTitle")}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                  {t("home.seoDesc")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">{t("home.seoCards.howItWorks")}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {t("home.seoCards.howItWorksDesc")}
                  </p>
                  <LocaleLink href="/remover" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    {t("home.seoCards.tryRemover")} <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">{t("home.seoCards.png")}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {t("home.seoCards.pngDesc")}
                  </p>
                  <LocaleLink href="/blog/transparent-pngs-amazon-etsy" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    {t("home.seoCards.readGuide")} <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">{t("home.seoCards.handles")}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {t("home.seoCards.handlesDesc")}
                  </p>
                  <LocaleLink href="/tools" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    {t("home.seoCards.viewAllTools")} <ExternalLink className="h-3 w-3" />
                  </LocaleLink>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-base font-semibold text-white">{t("home.seoCards.refine")}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {t("home.seoCards.refineDesc")}
                  </p>
                  <LocaleLink href="/faq" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary">
                    {t("home.seoCards.visitFaq")} <ExternalLink className="h-3 w-3" />
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.compatibility")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.worksEvery")}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                {t("home.worksEveryDesc")}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {(["png", "jpeg", "webp", "avif", "heic", "tiff", "gif", "bmp"] as const).map((fmt, i) => (
                <motion.div
                  key={fmt}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="group rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:bg-secondary/[0.04]"
                >
                  <FileImage className="mx-auto h-6 w-6 text-white/40 transition duration-300 group-hover:text-secondary" />
                  <div className="mt-2 text-sm font-semibold text-white transition duration-300 group-hover:text-secondary">{fmt === "jpeg" ? "JPEG" : fmt.charAt(0).toUpperCase() + fmt.slice(1)}</div>
                  <div className="mt-0.5 text-[11px] text-white/40">{t(`home.formats.${fmt}`)}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <LocaleLink
                href="/tools"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {t("home.exploreAllTools")} <ArrowUpRight className="h-3.5 w-3.5" />
              </LocaleLink>
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.blogGuides")}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.latestArticles")}</h2>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  {t("home.latestArticlesDesc")}
                </p>
              </div>
              <LocaleLink
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {t("home.viewAllArticles")}
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
                  <h3 className="relative mt-3 text-base font-semibold text-white transition group-hover:text-secondary">{t(`blog.articles.${post.slug}.title`)}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-white/50">{t(`blog.articles.${post.slug}.excerpt`)}</p>
                  <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                    {t("home.readArticle")} <ArrowRight className="h-3 w-3" />
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.testimonials")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.whatUsersSay")}</h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
                >
                  <Quote className="h-6 w-6 text-white/20" />
                  <p className="mt-3 text-sm leading-7 text-white/70">{item.content}</p>
                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: item.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-secondary/80" />
                    ))}
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-white/40">{item.role}</div>
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.performance")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.builtForSpeed")}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">{t("home.builtForSpeedDesc")}</p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {(["time", "edge", "batch", "uptime"] as const).map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{t(`home.performanceMetrics.${key}`)}</div>
                      <div className="mt-1 text-xs text-white/40">{t(`home.performanceMetrics.${key}Desc`)}</div>
                    </div>
                    <div className="shrink-0 text-2xl font-bold text-white">{t(`home.performanceMetrics.${key}Value`)}</div>
                  </div>
                  <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${{time:92, edge:96, batch:85, uptime:98}[key]}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", {time:"from-sky-500", edge:"from-violet-500", batch:"from-emerald-500", uptime:"from-amber-500"}[key], "to-white/40")}
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.faqLabel")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.commonQuestions")}</h2>
            </div>

            <div className="mt-10 mx-auto max-w-3xl space-y-3">
              {([1, 2, 3, 4] as const).map((i) => (
                <details
                  key={i}
                  className="group rounded-[1.25rem] border border-white/10 bg-white/[0.035] transition hover:border-white/20"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-white">
                    {t(`home.homeFaq.q${i}`)}
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-6 text-white/50">
                    {t(`home.homeFaq.a${i}`)}
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-6 text-center">
              <LocaleLink
                href="/faq"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {t("home.viewAllFaqs")}
                <ArrowUpRight className="h-3.5 w-3.5" />
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
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">{t("home.readyToRemove")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50">
                {t("home.readyDesc")}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black shadow-[0_18px_70px_-22px_rgba(255,255,255,0.72)] transition duration-300 hover:-translate-y-0.5 hover:bg-secondary"
              >
                <Upload className="h-4 w-4" />
                {t("home.uploadFirst")}
              </button>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/40">
                <LocaleLink href="/about" className="hover:text-white/70">{t("home.links.about")}</LocaleLink>
                <span>·</span>
                <LocaleLink href="/comparison" className="hover:text-white/70">{t("home.links.comparison")}</LocaleLink>
                <span>·</span>
                <LocaleLink href="/blog" className="hover:text-white/70">{t("home.links.blog")}</LocaleLink>
                <span>·</span>
                <LocaleLink href="/faq" className="hover:text-white/70">{t("home.links.faq")}</LocaleLink>
              </div>
            </div>
          </motion.div>

        </section>
      </div>
    </AppLayout>
  );
}
