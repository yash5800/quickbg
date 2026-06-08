"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { localePrefixes, defaultLocale } from "@/lib/i18n/config";

import { Scissors, Maximize2, Palette, Layers, Crop, Wand2, Contrast, FileImage } from "lucide-react";
import { bgremovep, resize, bgreplace, bgblur, crop, sharpness, adjust, convert } from "@/lib/demo-smaples";

const toolList = [
  { id: "removeBg", icon: Scissors, href: "/remover", img: bgremovep, accent: "from-sky-500/20" },
  { id: "replaceBg", icon: Palette, href: "/replace-bg", img: bgreplace, accent: "from-emerald-500/20" },
  { id: "blurBg", icon: Layers, href: "/blur-bg", img: bgblur, accent: "from-rose-500/20" },
  { id: "resize", icon: Maximize2, href: "/resize", img: resize, accent: "from-violet-500/20" },
  { id: "crop", icon: Crop, href: "/crop", img: crop, accent: "from-secondary/20" },
  { id: "sharpness", icon: Wand2, href: "/sharpness", img: sharpness, accent: "from-amber-500/20" },
  { id: "adjust", icon: Contrast, href: "/adjust", img: adjust, accent: "from-cyan-500/20" },
  { id: "converter", icon: FileImage, href: "/converter", img: convert, accent: "from-indigo-500/20" },
];

export function InteractiveToolPlayground() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeTool = toolList[activeIndex];

  const goTo = useCallback((i: number) => {
    setActiveIndex(i);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % toolList.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused]);

  const localizedPath = (path: string) => {
    if (locale === defaultLocale) return path;
    return `${localePrefixes[locale]}${path}`;
  };

  const toolKey = (id: string) => id.charAt(0).toLowerCase() + id.slice(1);

  return (
    <div className="relative">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">
          {t("home.imageToolkit")}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
          {t("home.toolkitTitle")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/50">
          {t("home.toolkitDesc")}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        {/* Tool thumbnails */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {toolList.map((tool, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={tool.id}
                onClick={() => goTo(i)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                  isActive
                    ? "border-secondary/50 bg-secondary/[0.08] shadow-[0_0_30px_-8px_hsl(var(--secondary)_/_0.3)]"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20"
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={tool.img}
                    alt=""
                    fill
                    className={cn(
                      "object-cover transition-all duration-500",
                      isActive ? "scale-105 brightness-110" : "scale-100 brightness-75 group-hover:scale-105 group-hover:brightness-90"
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {isActive && (
                    <div className="absolute inset-0 ring-1 ring-inset ring-secondary/30" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-2 sm:px-3">
                  <tool.icon className={cn("h-3 w-3 shrink-0", isActive ? "text-secondary" : "text-white/40")} />
                  <span className={cn(
                    "truncate text-xs font-medium",
                    isActive ? "text-white" : "text-white/50"
                  )}>
                    {t(`home.tools.${toolKey(tool.id)}`)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active tool showcase */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-b from-secondary/5 to-transparent opacity-50" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.9)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                  <Image
                    src={activeTool.img}
                    alt={t(`home.tools.${toolKey(activeTool.id)}`)}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <activeTool.icon className="h-5 w-5 text-secondary" />
                    <h3 className="text-lg font-semibold text-white">
                      {t(`home.tools.${toolKey(activeTool.id)}`)}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
                    {t(`home.tools.${toolKey(activeTool.id)}Desc`)}
                  </p>
                  <button
                    onClick={() => router.push(localizedPath(activeTool.href))}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black transition duration-300 hover:bg-secondary hover:-translate-y-0.5"
                  >
                    {t("home.openTool")}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-1.5">
                {toolList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === activeIndex
                        ? "w-6 bg-secondary"
                        : "w-1.5 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-white/50 transition hover:border-white/20 hover:text-white/80"
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {isPaused ? "Play" : "Auto"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
