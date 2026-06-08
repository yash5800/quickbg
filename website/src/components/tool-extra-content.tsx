"use client";

import { useLocale } from "@/contexts/LocaleContext";

interface ToolExtraContentProps {
  toolKey: string;
  variant?: "dark" | "light";
}

export function ToolExtraContent({ toolKey, variant = "dark" }: ToolExtraContentProps) {
  const { t } = useLocale();

  const isDark = variant === "dark";

  const sectionClass = `mx-auto max-w-5xl px-4 sm:px-6`;
  const cardClass = isDark
    ? "rounded-xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
    : "rounded-xl border border-border/70 bg-background/55 p-6 sm:p-8 backdrop-blur";
  const headingClass = `text-xl font-semibold tracking-normal sm:text-2xl ${isDark ? "text-white" : "text-foreground"}`;
  const paragraphClass = `mt-4 leading-7 ${isDark ? "text-white/70" : "text-muted-foreground"}`;

  return (
    <section className={sectionClass}>
      <div className="mt-12 space-y-8">
        <div className={cardClass}>
          <h2 className={headingClass}>
            {t(`${toolKey}.benefits.heading`)}
          </h2>
          <p className={paragraphClass}>
            {t(`${toolKey}.benefits.content`)}
          </p>
        </div>

        <div className={cardClass}>
          <h2 className={headingClass}>
            {t(`${toolKey}.howItWorks.heading`)}
          </h2>
          <p className={paragraphClass}>
            {t(`${toolKey}.howItWorks.content`)}
          </p>
        </div>

        <div className={cardClass}>
          <h2 className={headingClass}>
            {t(`${toolKey}.tips.heading`)}
          </h2>
          <p className={paragraphClass}>
            {t(`${toolKey}.tips.content`)}
          </p>
        </div>
      </div>
    </section>
  );
}
