"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, Check, Sparkles } from "lucide-react";

import originalImage from "../../assets/demo/org.jpg";
import processedImage from "../../assets/demo/pro.png";

export function DemoRevealSlider() {
  const prefersReducedMotion = useReducedMotion();

  const revealTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 5.6,
        ease: "easeInOut" as const,
        times: [0, 0.14, 0.56, 0.86, 1],
        repeat: Infinity,
        repeatDelay: 1.15,
      };

  const originalCropKeyframes = prefersReducedMotion
    ? ["inset(0 50% 0 0)"]
    : ["inset(0 100% 0 0)", "inset(0 100% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)", "inset(0 100% 0 0)"];
  const handleLeftKeyframes = prefersReducedMotion ? ["0%"] : ["0%", "0%", "100%", "100%", "0%"];

  return (
    <div className="relative mx-auto w-full max-w-[42rem]">
      <motion.div
        aria-hidden="true"
        className="absolute -left-6 top-16 h-20 w-20 rounded-[1.4rem] border border-white/10 bg-lime-300/90 shadow-[0_24px_90px_-28px_rgba(190,242,100,0.8)]"
        animate={prefersReducedMotion ? undefined : { y: [0, -10, 0], rotate: [-8, -2, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-3 bottom-24 h-16 w-16 rounded-full border border-white/10 bg-sky-300/20 backdrop-blur"
        animate={prefersReducedMotion ? undefined : { y: [0, 12, 0], x: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.section
        className="premium-glass relative z-10 overflow-hidden rounded-[2rem] border border-white/10 p-3 shadow-[0_42px_120px_-48px_rgba(0,0,0,0.95)] sm:rounded-[2.4rem] sm:p-4"
        animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#070707] sm:rounded-[2rem]">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#7bd88f]" />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/60 sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              QuickBG preview
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.72fr_1fr]">
            <div className="border-b border-white/10 bg-black/20 p-4 lg:border-b-0 lg:border-r">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs font-medium text-white/40">Processing queue</div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Upload", "Complete"],
                    ["AI mask", "Running"],
                    ["Transparent PNG", "Ready"],
                  ].map(([label, status], index) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                          {index === 1 ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> : <Check className="h-3 w-3" />}
                        </span>
                        {label}
                      </div>
                      <span className="text-[11px] text-white/40">{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-[11px] text-white/40">Output</div>
                  <div className="mt-2 text-lg font-semibold text-white">PNG</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-[11px] text-white/40">Quality</div>
                  <div className="mt-2 text-lg font-semibold text-white">Full</div>
                </div>
              </div>
            </div>

            <div className="relative p-3 sm:p-4">
              <div className="relative h-[30rem] overflow-hidden rounded-[1.35rem] bg-[#f5f7fb] sm:h-[35rem] lg:h-[38rem]">
                <div className="checkerboard absolute inset-0 opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20" />

                <div className="absolute inset-0">
                  <Image
                    src={processedImage}
                    alt="Processed demo image with background removed"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                  />
                </div>

                <motion.div
                  className="absolute inset-0"
                  animate={{ clipPath: originalCropKeyframes }}
                  transition={revealTransition}
                >
                  <Image
                    src={originalImage}
                    alt="Original demo image"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                  />
                </motion.div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                <motion.div
                  className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-white shadow-[0_0_24px_rgba(255,255,255,0.85)]"
                  animate={{ left: handleLeftKeyframes }}
                  transition={revealTransition}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-black shadow-[0_18px_55px_-18px_rgba(0,0,0,0.65)]">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>
                </motion.div>

                <div className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                  Original
                </div>
                <div className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                  Removed
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
