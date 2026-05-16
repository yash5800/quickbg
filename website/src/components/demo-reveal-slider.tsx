"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";

import originalImage from "../../assets/demo/org.jpg";
import processedImage from "../../assets/demo/pro.png";

export function DemoRevealSlider() {
  const prefersReducedMotion = useReducedMotion();

  const revealTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 5.2,
        ease: "easeInOut" as const,
        times: [0, 0.16, 0.58, 0.88, 1],
        repeat: Infinity,
        repeatDelay: 1.25,
      };

  const revealKeyframes = prefersReducedMotion
    ? ["inset(0 0 0 0%)"]
    : ["inset(0 100% 0 0%)", "inset(0 100% 0 0%)", "inset(0 0 0 0%)", "inset(0 0 0 0%)", "inset(0 100% 0 0%)"];

  const handleLeftKeyframes = prefersReducedMotion
    ? ["0%"]
    : ["0%", "0%", "100%", "100%", "0%"];

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/75 p-4 shadow-[0_30px_90px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-sky-500/10" />

      <div className="relative overflow-hidden rounded-[1.8rem] border border-white/50 bg-white/90 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.45)]">
        <div className="relative h-[28rem] w-full bg-[#f4f7fb] sm:h-[34rem] lg:h-[42rem]">
          <div className="checkerboard absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/10" />

          <div className="absolute inset-0">
            <Image
              src={processedImage}
              alt="Processed demo image with background removed"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
            />

            <motion.div
              className="absolute inset-0"
              animate={{ clipPath: revealKeyframes }}
              transition={revealTransition}
            >
              <Image
                src={originalImage}
                alt="Original demo image"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-cover"
              />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />

            <motion.div
              className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-white shadow-[0_0_24px_rgba(255,255,255,0.85)]"
              animate={{ left: handleLeftKeyframes }}
              transition={revealTransition}
            >
              <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-primary shadow-[0_16px_40px_-16px_rgba(15,23,42,0.65)]">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
            </motion.div>

            <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              Processed
            </div>
            <div className="absolute bottom-4 right-4 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm">
              Original
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}