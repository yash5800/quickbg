"use client";

import { useLocale } from "@/contexts/LocaleContext";

interface ToolFaqProps {
  toolKey: string;
  variant?: "dark" | "light";
}

export function ToolFaq({ toolKey, variant = "dark" }: ToolFaqProps) {
  const { t } = useLocale();

  const faqCount = 15;
  const items = Array.from({ length: faqCount }, (_, i) => {
    const n = i + 1;
    const key = `${toolKey}.faq.q${n}`;
    const q = t(key);
    if (q === key) return null;
    return { q, a: t(`${toolKey}.faq.a${n}`) };
  }).filter((x): x is { q: string; a: string } => x !== null);

  const isDark = variant === "dark";

  return (
    <section className="mx-auto mb-20 mt-16 max-w-5xl px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className={`text-2xl font-semibold tracking-normal sm:text-3xl ${isDark ? "text-white" : "text-foreground"}`}>
          {t(`${toolKey}.faq.heading`)}
        </h2>
      </div>
      <div className="mt-8 space-y-4">
        {items.map((item, i) => (
          <details
            key={i}
            className={`group rounded-xl border p-5 open:border-white/20 ${
              isDark
                ? "border-white/10 bg-white/[0.04]"
                : "border-border/70 bg-background/55"
            }`}
          >
            <summary className={`flex cursor-pointer items-center justify-between text-sm font-semibold list-none ${
              isDark ? "text-white" : "text-foreground"
            }`}>
              {item.q}
              <span className={`ml-2 shrink-0 transition-transform group-open:rotate-180 ${
                isDark ? "text-white/40" : "text-muted-foreground"
              }`}>
                &#9660;
              </span>
            </summary>
            <p className={`mt-3 text-sm leading-6 ${isDark ? "text-white/50" : "text-muted-foreground"}`}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

interface ToolExtraContentProps {
  toolKey: string;
  variant?: "dark" | "light";
}

export function ToolExtraContent({ toolKey, variant = "dark" }: ToolExtraContentProps) {
  const { t } = useLocale();

  const isDark = variant === "dark";

  const cardClass = isDark
    ? "rounded-xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
    : "rounded-xl border border-border/70 bg-background/55 p-6 sm:p-8 backdrop-blur";
  const headingClass = `text-xl font-semibold tracking-normal sm:text-2xl ${isDark ? "text-white" : "text-foreground"}`;
  const paragraphClass = `mt-4 leading-7 ${isDark ? "text-white/70" : "text-muted-foreground"}`;

  const sections = [
    { key: "benefits", skipIfMissing: false },
    { key: "howItWorks", skipIfMissing: false },
    { key: "tips", skipIfMissing: false },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mt-12 space-y-8">
        {sections.map(({ key, skipIfMissing }) => {
          const heading = t(`${toolKey}.${key}.heading`);
          const content = t(`${toolKey}.${key}.content`);
          if (skipIfMissing && (content === `${toolKey}.${key}.content` || !content)) return null;
          return (
            <div key={key} className={cardClass}>
              <h2 className={headingClass}>
                {heading}
              </h2>
              <p className={paragraphClass}>
                {content}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
