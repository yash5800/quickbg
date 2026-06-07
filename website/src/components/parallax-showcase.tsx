"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue, useReducedMotion } from "framer-motion";
import { Upload, Zap, Globe, ShieldCheck, Sparkles, ArrowUpRight, Layers, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

interface Stat {
  value: string;
  label: string;
  sub: string;
}

interface IconData {
  Icon: LucideIcon;
  color: string;
  size: string;
  x: string;
  y: string;
  driftX: number;
  driftY: number;
}

const stats: Stat[] = [
  { value: "50K+", label: "Images processed", sub: "and counting every day" },
  { value: "150+", label: "Countries reached", sub: "from US to Japan to Brazil" },
  { value: "99.2%", label: "AI accuracy rate", sub: "on high-contrast subjects" },
  { value: "3.2s", label: "Average speed", sub: "upload to download" },
];

const floatingIconData: IconData[] = [
  { Icon: Zap, color: "text-secondary/80", size: "h-8 w-8", x: "15%", y: "10%", driftX: 40, driftY: -30 },
  { Icon: ShieldCheck, color: "text-secondary/80", size: "h-6 w-6", x: "82%", y: "15%", driftX: -35, driftY: 25 },
  { Icon: Sparkles, color: "text-secondary/80", size: "h-7 w-7", x: "10%", y: "72%", driftX: 30, driftY: 35 },
  { Icon: Globe, color: "text-primary/80", size: "h-9 w-9", x: "88%", y: "78%", driftX: -25, driftY: -40 },
  { Icon: Layers, color: "text-primary/80", size: "h-5 w-5", x: "50%", y: "5%", driftX: -20, driftY: 20 },
  { Icon: Clock, color: "text-primary/80", size: "h-6 w-6", x: "5%", y: "45%", driftX: 25, driftY: -25 },
];

interface ScrollLinkedParallaxProps {
  prefersReducedMotion?: boolean | null;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

export function ScrollLinkedParallax({ prefersReducedMotion, fileInputRef }: ScrollLinkedParallaxProps) {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isReduced = prefersReducedMotion ?? reduced ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.6, 1, 1, 0.6]);
  const contentScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.92, 1, 1, 0.95]);

  const bgGradient = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      "radial-gradient(600px circle at 30% 30%, rgba(56,189,248,0.08), transparent)",
      "radial-gradient(600px circle at 60% 50%, rgba(167,139,250,0.08), transparent)",
      "radial-gradient(600px circle at 80% 70%, rgba(132,204,22,0.08), transparent)",
    ]
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const iconX: MotionValue<number>[] = floatingIconData.map((d) => useTransform(scrollYProgress, [0, 1], [0, d.driftX]));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const iconY: MotionValue<number>[] = floatingIconData.map((d) => useTransform(scrollYProgress, [0, 1], [0, d.driftY]));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const iconRotate: MotionValue<number>[] = floatingIconData.map((_, i) => useTransform(scrollYProgress, [0, 1], [0, i % 2 === 0 ? 15 : -15]));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const iconOpacityArr: MotionValue<number>[] = floatingIconData.map(() => useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.3, 0.7, 0.7, 0.3]));

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cardY: MotionValue<number>[] = stats.map((_, i) => useTransform(scrollYProgress, [0, 1], [60 - i * 12, -40 + i * 8]));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cardOpacity: MotionValue<number>[] = stats.map((_, i) => useTransform(scrollYProgress, [0, 0.1 + i * 0.03, 0.8 - i * 0.03, 1], [0.3, 1, 1, 0.4]));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cardScale: MotionValue<number>[] = stats.map((_, i) => useTransform(scrollYProgress, [0, 0.15 + i * 0.03, 0.75 - i * 0.03, 1], [0.88, 1, 1, 0.92]));

  if (isReduced) {
    return (
      <div ref={sectionRef} className="p-8 sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("home.performanceMetrics.edge")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{t("home.performance")}</h2>
          <p className="mt-3 text-sm leading-6 text-white/50">{t("home.builtForSpeedDesc")}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
              <div className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{stat.value}</div>
              <div className="mt-2 text-sm font-semibold text-white/80">{stat.label}</div>
              <div className="mt-1 text-xs text-white/40">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative">
      <motion.div
        className="pointer-events-none absolute -inset-20"
        style={{ background: bgGradient }}
      />

      {floatingIconData.map((item, i) => (
        <motion.div
          key={i}
          className={cn("pointer-events-none absolute hidden md:block", item.color)}
          style={{
            left: item.x,
            top: item.y,
            x: iconX[i],
            y: iconY[i],
            rotate: iconRotate[i],
            opacity: iconOpacityArr[i],
          }}
        >
          <item.Icon className={cn(item.size, "drop-shadow-[0_0_12px_currentColor]")} />
        </motion.div>
      ))}

      <motion.div
        style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
        className="relative p-8 sm:p-10"
      >
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80"
          >
            {t("home.performanceMetrics.edge")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl"
          >
            {t("home.performance")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-sm leading-6 text-white/50"
          >
            {t("home.builtForSpeedDesc")}
          </motion.p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{ y: cardY[i], opacity: cardOpacity[i], scale: cardScale[i] }}
              className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="relative text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {stat.value}
              </div>
              <div className="relative mt-2 text-sm font-semibold text-white/80">{stat.label}</div>
              <div className="relative mt-1 text-xs text-white/40">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            type="button"
            onClick={() => fileInputRef?.current?.click()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/70 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <Upload className="h-4 w-4" />
            {t("home.uploadImage")}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
