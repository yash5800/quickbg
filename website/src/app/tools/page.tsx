"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scissors, Maximize2, Palette, Layers, Crop, Contrast, ArrowLeft, ArrowUpRight, Sparkles, FileImage, BookOpen, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { LocaleLink } from "@/components/locale-link";
import { useLocale } from "@/contexts/LocaleContext";
import { localePrefixes, defaultLocale } from "@/lib/i18n/config";
import { ToolSections } from "@/components/tool-sections";

const toolKeyMap: Record<string, string> = {
  "remove-bg": "removeBg",
  resize: "resize",
  "replace-bg": "replaceBg",
  "blur-bg": "blurBg",
  sharpness: "sharpness",
  crop: "crop",
  adjust: "adjust",
  converter: "converter",
};

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    badge: "Core",
    href: "/remover",
    accent: "text-secondary",
    glow: "from-sky-500/20",
    category: "Core Tools",
  },
  {
    id: "resize",
    icon: Maximize2,
    badge: "Popular",
    href: "/resize",
    accent: "text-primary",
    glow: "from-violet-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "replace-bg",
    icon: Palette,
    badge: "New",
    href: "/replace-bg",
    accent: "text-secondary",
    glow: "from-emerald-500/20",
    category: "Core Tools",
  },
  {
    id: "blur-bg",
    icon: Layers,
    badge: null,
    href: "/blur-bg",
    accent: "text-primary",
    glow: "from-rose-500/20",
    category: "Core Tools",
  },
  {
    id: "sharpness",
    icon: Sparkles,
    badge: "New",
    href: "/sharpness",
    accent: "text-secondary",
    glow: "from-amber-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "crop",
    icon: Crop,
    badge: null,
    href: "/crop",
    accent: "text-secondary",
    glow: "from-secondary/20",
    category: "Adjustment Tools",
  },
  {
    id: "adjust",
    icon: Contrast,
    badge: null,
    href: "/adjust",
    accent: "text-primary",
    glow: "from-cyan-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "converter",
    icon: FileImage,
    badge: "New",
    href: "/converter",
    accent: "text-primary",
    glow: "from-indigo-500/20",
    category: "Export Tools",
  },
];

const categories = [
  {
    id: "Core Tools",
    description: "Start here — these tools handle the heavy lifting of background and subject separation.",
  },
  {
    id: "Adjustment Tools",
    description: "Refine your image dimensions, framing, and visual quality after the cutout.",
  },
  {
    id: "Export Tools",
    description: "Prepare your final image for the destination format and platform requirements.",
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

const faqItems = [
  { id: "first" },
  { id: "multiple" },
  { id: "signup" },
  { id: "formats" },
  { id: "q5" },
  { id: "q6" },
  { id: "q7" },
  { id: "q8" },
  { id: "q9" },
  { id: "q10" },
  { id: "q11" },
  { id: "q12" },
  { id: "q13" },
  { id: "q14" },
  { id: "q15" },
];

const workflowTips = [
  {
    id: "ecom",
    steps: [0, 1, 2, 3],
    link: "/blog/ecommerce-product-photos-guide",
  },
  {
    id: "social",
    steps: [0, 1, 2, 3],
    link: "/blog/transparent-pngs-amazon-etsy",
  },
  {
    id: "listing",
    steps: [0, 1, 2, 3],
    link: "/blog/how-ai-background-removal-works",
  },
];

const chooseGuide = [
  { id: "cutout" },
  { id: "dimensions" },
  { id: "styled" },
  { id: "pop" },
  { id: "format" },
];

export default function ToolsPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const localizedPath = (path: string) => {
    if (locale === defaultLocale) return path;
    return `${localePrefixes[locale]}${path}`;
  };

  return (
    <AppLayout>
      <div className="tools-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ===== PAGE HEADER ===== */}
        <div className="mb-10 flex items-start gap-4">
          <Button onClick={() => router.push(localizedPath("/"))} variant="ghost" size="icon" className="mt-1 h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("nav.tools")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white sm:text-5xl">{t("tools.pageTitle")}</h1>
            <p className="mt-2 text-sm text-white/50">
              {t("tools.pageDesc")}
            </p>
          </div>
        </div>

        {/* ===== RECOMMENDED WORKFLOW ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-secondary" />
                {t("tools.recommended")}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                {t("tools.recommendedDesc")}
              </p>
            </div>
            <Button onClick={() => router.push(localizedPath("/remover"))} className="rounded-full bg-white text-black hover:bg-secondary">
              {t("tools.openRemoverBtn")}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ===== TOOL CATEGORIES ===== */}
        {categories.map((category) => {
          const categoryTools = tools.filter((t) => t.category === category.id);
          return (
            <div key={category.id} className="mb-10">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">{category.id}</h2>
                <p className="mt-1 text-sm text-white/50">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => {
                  const key = toolKeyMap[tool.id];
                  return (
                    <button
                      key={tool.id}
                      onClick={() => router.push(localizedPath(tool.href))}
                      className="premium-surface group relative overflow-hidden rounded-[1.5rem] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-white/20"
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
                      <h3 className="relative mt-5 text-lg font-semibold text-white">{t(`home.tools.${key}`)}</h3>
                      <p className="relative mt-2 text-sm leading-6 text-white/50">{t(`home.tools.${key}Desc`)}</p>
                      <div className="relative mt-3 flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                        <p className="text-xs leading-5 text-white/40">{t(`home.tools.${key}Tip`)}</p>
                      </div>
                      <div className="relative mt-5 border-t border-white/10 pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">{category.id.slice(0, -1)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ===== HOW TO CHOOSE THE RIGHT TOOL ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Quick reference</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.chooseHeading")}</h2>
            <p className="mt-2 text-sm text-white/50">{t("tools.chooseDesc")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chooseGuide.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">{t("tools.chooseGoal")}</p>
                <p className="mt-1 text-sm font-medium text-white">{t(`tools.chooseItems.${item.id}`)}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-secondary/80">{t("tools.chooseUse")}</p>
                <p className="mt-1 text-sm font-medium text-white">{t(`tools.chooseItems.${item.id}Tool`)}</p>
                <p className="mt-2 text-xs leading-5 text-white/50">{t(`tools.chooseItems.${item.id}Why`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== WORKFLOW TIPS ===== */}
        <div className="mb-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Guides & templates</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.workflowHeading")}</h2>
            <p className="mt-2 text-sm text-white/50">{t("tools.workflowDesc")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workflowTips.map((wf) => (
              <LocaleLink
                key={wf.id}
                href={wf.link}
                className="premium-surface group relative overflow-hidden rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <h3 className="relative text-base font-semibold text-white">{t(`tools.workflows.${wf.id}.title`)}</h3>
                <ol className="relative mt-4 space-y-2">
                  {wf.steps.map((stepIndex, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/50">
                        {i + 1}
                      </span>
                      {t(`tools.workflows.${wf.id}.steps.${stepIndex}`)}
                    </li>
                  ))}
                </ol>
                <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                  {t("tools.readFullGuide")} <ArrowRight className="h-3 w-3" />
                </div>
              </LocaleLink>
            ))}
          </div>
        </div>

        {/* ===== BLOG HIGHLIGHTS ===== */}
        <div className="mb-10">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Blog & articles</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.blogHeading")}</h2>
              <p className="mt-2 text-sm text-white/50">{t("tools.blogDesc")}</p>
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
                className="premium-surface group relative overflow-hidden rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20"
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
                  {t("blog.readArticle")} <ArrowRight className="h-3 w-3" />
                </div>
              </LocaleLink>
            ))}
          </div>
        </div>

        {/* ===== USE CASES ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Use cases</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.useCases.heading")}</h2>
          <p className="mt-4 leading-7 text-white/70">
            {t("tools.useCases.content")}
          </p>
        </div>

        {/* ===== COMMON MISTAKES ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Common mistakes</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.commonMistakes.heading")}</h2>
          <p className="mt-4 leading-7 text-white/70">
            {t("tools.commonMistakes.content")}
          </p>
        </div>

        {/* ===== COMPARISON ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Comparison</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.comparison.heading")}</h2>
          <p className="mt-4 leading-7 text-white/70">
            {t("tools.comparison.content")}
          </p>
        </div>

        {/* ===== TUTORIAL ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Tutorial</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.tutorial.heading")}</h2>
          <p className="mt-4 leading-7 text-white/70">
            {t("tools.tutorial.content")}
          </p>
        </div>

        {/* ===== FAQ ===== */}
        <div className="mb-6">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("tools.faqHeading")}</h2>
            <p className="mt-2 text-sm text-white/50">{t("tools.faqDesc")}</p>
          </div>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.id}
                className="group rounded-[1.25rem] border border-white/10 bg-white/[0.035] transition hover:border-white/20"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-white">
                  {t(`tools.faqItems.${item.id}`)}
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-6 text-white/50">
                  {t(`tools.faqItems.${item.id}A`)}
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
        </div>
        <ToolSections toolKey="tools" />
      </div>
    </AppLayout>
  );
}
