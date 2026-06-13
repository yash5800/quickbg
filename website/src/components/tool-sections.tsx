"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  Sparkles, Zap, Shield, Download, Image, Crop, Maximize2, Palette,
  Layers, Sliders, FileImage, Scissors, CheckCircle, AlertCircle,
  ArrowRight, Star, Users,
} from "lucide-react";
import { LocaleLink } from "@/components/locale-link";

interface ToolSectionsProps {
  toolKey: string;
  variant?: "dark" | "light";
}

const sectionClass = `mx-auto max-w-5xl px-4 sm:px-6`;

const featureIcons: Record<string, React.ElementType> = {
  sparkles: Sparkles, zap: Zap, shield: Shield, download: Download,
  image: Image, crop: Crop, maximize: Maximize2, palette: Palette,
  layers: Layers, sliders: Sliders, file: FileImage, scissors: Scissors,
};

export function ToolSections({ toolKey, variant = "dark" }: ToolSectionsProps) {
  const { t } = useLocale();
  const isDark = variant === "dark";

  const cardClass = `rounded-xl border ${isDark ? "border-white/10 bg-white/[0.04]" : "border-border/70 bg-background/55 backdrop-blur"} p-6 sm:p-8`;
  const h2Class = `text-xl font-semibold tracking-normal sm:text-2xl ${isDark ? "text-white" : "text-foreground"}`;
  const pClass = `mt-4 leading-7 ${isDark ? "text-white/70" : "text-muted-foreground"}`;
  const s = {
    txt: (o: string) => isDark ? `text-white${o}` : `text-foreground${o}`,
    textMuted: isDark ? "text-white/50" : "text-muted-foreground",
    textMuted2: isDark ? "text-white/40" : "text-muted-foreground/70",
    textMuted3: isDark ? "text-white/30" : "text-muted-foreground/50",
    h3: `text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`,
    cardBorder: isDark ? "border-white/10" : "border-border/70",
    cardBorderHover: isDark ? "hover:border-white/20" : "hover:border-border",
    cardBg: isDark ? "bg-white/[0.04]" : "bg-background/55",
    cardBg2: isDark ? "bg-white/[0.03]" : "bg-background/40",
    cardBg3: isDark ? "bg-white/[0.02]" : "bg-background/30",
    item: (extra = "") => `rounded-xl border ${isDark ? "border-white/10 bg-white/[0.04]" : "border-border/70 bg-background/55"} p-5 ${isDark ? "hover:border-white/20" : "hover:border-border"} transition ${extra}`,
  };

  const has = (key: string) => {
    const val = t(key);
    return val && val !== key;
  };

  const title = (path: string) => {
    const tVal = t(`${path}.title`);
    if (tVal && tVal !== `${path}.title`) return tVal;
    return t(`${path}.heading`);
  };

  return (
    <div className="space-y-16 mb-20">
      {has(`${toolKey}.demo.heading`) && (
        <section className={sectionClass}>
          {has(`${toolKey}.demo.images.0.src`) ? (
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <h2 className={h2Class}>{title(`${toolKey}.demo`)}</h2>
                <p className={pClass}>{t(`${toolKey}.demo.content`)}</p>
              </div>
              <div className={`rounded-xl border ${s.cardBorder} ${s.cardBg} p-2 overflow-hidden`}>
                <img
                  src={t(`${toolKey}.demo.images.0.src`)}
                  alt={t(`${toolKey}.demo.images.0.alt`)}
                  className="w-full rounded-lg object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className={cardClass}>
              <h2 className={h2Class}>{title(`${toolKey}.demo`)}</h2>
              <p className={pClass}>{t(`${toolKey}.demo.content`)}</p>
            </div>
          )}
        </section>
      )}

      {has(`${toolKey}.features.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.features`)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => {
              const iconName = t(`${toolKey}.features.item${i}Icon`);
              const itemTitle = t(`${toolKey}.features.item${i}Title`);
              if (!itemTitle || itemTitle === `${toolKey}.features.item${i}Title`) return null;
              const Icon = featureIcons[iconName] || Sparkles;
              return (
                <div key={i} className={s.item()}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${s.cardBorder} bg-black/30 text-secondary`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`mt-4 ${s.h3}`}>{itemTitle}</h3>
                  <p className={`mt-2 text-xs leading-5 ${s.textMuted}`}>{t(`${toolKey}.features.item${i}Desc`)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.whyUse.heading`) && (
        <section className={sectionClass}>
          <div className={`${cardClass} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
            <div className="relative">
              <h2 className={h2Class}>{title(`${toolKey}.whyUse`)}</h2>
              <p className={pClass}>{t(`${toolKey}.whyUse.content`)}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => {
                  const v = t(`${toolKey}.whyUse.stat${i}Value`);
                  if (!v || v === `${toolKey}.whyUse.stat${i}Value`) return null;
                  return (
                    <div key={i} className={`rounded-lg border ${s.cardBorder} ${s.cardBg2} p-4 text-center`}>
                      <p className="text-2xl font-bold text-secondary">{v}</p>
                      <p className={`mt-1 text-xs ${s.textMuted}`}>{t(`${toolKey}.whyUse.stat${i}Label`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {has(`${toolKey}.deepDive.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.deepDive`)}</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <p className={pClass}>{t(`${toolKey}.deepDive.content1`)}</p>
            </div>
            <div className={cardClass}>
              <p className={pClass}>{t(`${toolKey}.deepDive.content2`)}</p>
            </div>
          </div>
        </section>
      )}

      {has(`${toolKey}.audience.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.audience`)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => {
              const itemTitle = t(`${toolKey}.audience.item${i}Title`);
              if (!itemTitle || itemTitle === `${toolKey}.audience.item${i}Title`) return null;
              return (
                <div key={i} className={s.item("text-center")}>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className={`mt-4 ${s.h3}`}>{itemTitle}</h3>
                  <p className={`mt-2 text-xs leading-5 ${s.textMuted}`}>{t(`${toolKey}.audience.item${i}Desc`)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.platformRef.heading`) && (
        <section className={sectionClass}>
          <div className={cardClass}>
            <h2 className={h2Class}>{title(`${toolKey}.platformRef`)}</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${s.cardBorder}`}>
                    <th className={`py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider ${s.textMuted2}`}>{t(`${toolKey}.platformRef.col1`)}</th>
                    <th className={`py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider ${s.textMuted2}`}>{t(`${toolKey}.platformRef.col2`)}</th>
                    <th className={`py-3 text-left text-xs font-semibold uppercase tracking-wider ${s.textMuted2}`}>{t(`${toolKey}.platformRef.col3`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((i) => {
                    const c1 = t(`${toolKey}.platformRef.row${i}Col1`);
                    if (!c1 || c1 === `${toolKey}.platformRef.row${i}Col1`) return null;
                    return (
                      <tr key={i} className={`border-b ${s.cardBorder} last:border-0`}>
                        <td className={`py-3 pr-4 ${s.h3}`}>{c1}</td>
                        <td className={`py-3 pr-4 ${s.txt("/70")}`}>{t(`${toolKey}.platformRef.row${i}Col2`)}</td>
                        <td className={`py-3 ${s.txt("/70")}`}>{t(`${toolKey}.platformRef.row${i}Col3`)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {has(`${toolKey}.proTips.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.proTips`)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => {
              const itemTitle = t(`${toolKey}.proTips.item${i}Title`);
              if (!itemTitle || itemTitle === `${toolKey}.proTips.item${i}Title`) return null;
              return (
                <div key={i} className={s.item("flex gap-4")}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">{i}</div>
                  <div>
                    <h3 className={s.h3}>{itemTitle}</h3>
                    <p className={`mt-1 text-xs leading-5 ${s.textMuted}`}>{t(`${toolKey}.proTips.item${i}Desc`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.troubleshoot.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.troubleshoot`)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => {
              const problem = t(`${toolKey}.troubleshoot.item${i}Problem`);
              if (!problem || problem === `${toolKey}.troubleshoot.item${i}Problem`) return null;
              return (
                <div key={i} className={s.item("")}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div>
                      <h3 className={s.h3}>{problem}</h3>
                      <p className={`mt-2 text-xs leading-5 ${s.textMuted}`}>{t(`${toolKey}.troubleshoot.item${i}Solution`)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.comparison.heading`) && (
        <section className={sectionClass}>
          <div className={cardClass}>
            <h2 className={h2Class}>{title(`${toolKey}.comparison`)}</h2>
            <p className={pClass}>{t(`${toolKey}.comparison.content`)}</p>
          </div>
        </section>
      )}

      {has(`${toolKey}.useCases.heading`) && (
        <section className={sectionClass}>
          <div className={cardClass}>
            <h2 className={h2Class}>{title(`${toolKey}.useCases`)}</h2>
            <p className={pClass}>{t(`${toolKey}.useCases.content`)}</p>
          </div>
        </section>
      )}

      {has(`${toolKey}.workflow.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.workflow`)}</h2>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => {
              const step = t(`${toolKey}.workflow.step${i}`);
              if (!step || step === `${toolKey}.workflow.step${i}`) return null;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`rounded-xl border ${s.cardBorder} ${s.cardBg} px-4 py-3 text-sm ${s.txt("/70")}`}>{step}</div>
                  {i < 5 && <ArrowRight className="h-4 w-4 text-white/30" />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.tutorial.heading`) && (
        <section className={sectionClass}>
          <div className={cardClass}>
            <h2 className={h2Class}>{title(`${toolKey}.tutorial`)}</h2>
            {has(`${toolKey}.tutorial.step1`) ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => {
                  const step = t(`${toolKey}.tutorial.step${i}`);
                  if (!step || step === `${toolKey}.tutorial.step${i}`) return null;
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">{i}</div>
                      <p className={`text-sm leading-6 ${s.txt("/70")}`}>{step}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={pClass}>{t(`${toolKey}.tutorial.content`)}</p>
            )}
          </div>
        </section>
      )}

      {has(`${toolKey}.testimonials.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.testimonials`)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => {
              const quote = t(`${toolKey}.testimonials.item${i}Quote`);
              if (!quote || quote === `${toolKey}.testimonials.item${i}Quote`) return null;
              return (
                <div key={i} className={s.item("")}>
                  <div className="flex gap-1 text-secondary">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3 w-3 fill-current" />)}
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${s.txt("/70")}`}>&ldquo;{quote}&rdquo;</p>
                  <p className={`mt-2 text-xs font-medium ${s.textMuted2}`}>&mdash; {t(`${toolKey}.testimonials.item${i}Author`)}</p>
                  {has(`${toolKey}.testimonials.item${i}Role`) && (
                    <p className={`text-xs ${s.textMuted3}`}>{t(`${toolKey}.testimonials.item${i}Role`)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.related.heading`) && (
        <section className={sectionClass}>
          <div className="mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.related`)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => {
              const slug = t(`${toolKey}.related.item${i}Slug`);
              const itemTitle = t(`${toolKey}.related.item${i}Title`);
              if (!slug || slug === `${toolKey}.related.item${i}Slug`) return null;
              return (
                <LocaleLink key={i} href={`/blog/${slug}`} className={s.item("group block")}>
                  <h3 className={`text-sm font-semibold group-hover:text-secondary transition ${isDark ? "text-white" : "text-foreground"}`}>{itemTitle}</h3>
                  {has(`${toolKey}.related.item${i}Desc`) && (
                    <p className={`mt-2 text-xs leading-5 ${s.textMuted}`}>{t(`${toolKey}.related.item${i}Desc`)}</p>
                  )}
                  <p className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${s.textMuted2} group-hover:text-white transition`}>
                    {t("blog.readArticle")} <ArrowRight className="h-3 w-3" />
                  </p>
                </LocaleLink>
              );
            })}
          </div>
        </section>
      )}

      {has(`${toolKey}.specs.heading`) && (
        <section className={sectionClass}>
          <div className={cardClass}>
            <h2 className={h2Class}>{title(`${toolKey}.specs`)}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => {
                const label = t(`${toolKey}.specs.item${i}Label`);
                if (!label || label === `${toolKey}.specs.item${i}Label`) return null;
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border ${s.cardBorder} ${s.cardBg3} px-4 py-3`}>
                    <CheckCircle className="h-4 w-4 shrink-0 text-secondary" />
                    <div>
                      <p className={`text-xs ${s.textMuted2}`}>{label}</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-foreground"}`}>{t(`${toolKey}.specs.item${i}Value`)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {has(`${toolKey}.commonMistakes.heading`) && (
        <section className={sectionClass}>
          <div className="text-center mb-8">
            <h2 className={h2Class}>{title(`${toolKey}.commonMistakes`)}</h2>
          </div>
          {has(`${toolKey}.commonMistakes.item1Title`) ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => {
                const itemTitle = t(`${toolKey}.commonMistakes.item${i}Title`);
                if (!itemTitle || itemTitle === `${toolKey}.commonMistakes.item${i}Title`) return null;
                return (
                  <div key={i} className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                      <div>
                        <h3 className={s.h3}>{itemTitle}</h3>
                        <p className={`mt-1 text-xs leading-5 ${s.textMuted}`}>{t(`${toolKey}.commonMistakes.item${i}Desc`)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={sectionClass}>
              <p className={pClass}>{t(`${toolKey}.commonMistakes.content`)}</p>
            </div>
          )}
        </section>
      )}

      {has(`${toolKey}.cta.heading`) && (
        <section className={sectionClass}>
          <div className="rounded-2xl bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/20 p-8 sm:p-12 text-center">
            <h2 className={h2Class}>{title(`${toolKey}.cta`)}</h2>
            <p className={`${pClass} max-w-2xl mx-auto`}>{t(`${toolKey}.cta.content`)}</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <LocaleLink href={`/${toolKey}`} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-secondary transition">
                {t(`${toolKey}.cta.btnText`)} <ArrowRight className="h-4 w-4" />
              </LocaleLink>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
