"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scissors, Maximize2, Palette, Layers, Crop, Contrast, ArrowLeft, ArrowUpRight, Sparkles, FileImage, BookOpen, ChevronRight, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image with AI precision.",
    tip: "Perfect for product photography, portraits, and e-commerce listings",
    badge: "Core",
    href: "/remover",
    accent: "text-sky-300",
    glow: "from-sky-500/20",
    category: "Core Tools",
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize images to perfect dimensions with preset ratios.",
    tip: "Ideal for Amazon (1:1), Instagram (4:5), YouTube (16:9)",
    badge: "Popular",
    href: "/resize",
    accent: "text-violet-300",
    glow: "from-violet-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Replace backgrounds with solid colors, gradients, or custom images.",
    tip: "Create branded product shots with solid colors or custom backgrounds",
    badge: "New",
    href: "/replace-bg",
    accent: "text-emerald-300",
    glow: "from-emerald-500/20",
    category: "Core Tools",
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Add soft, adjustable blur effects to image backgrounds.",
    tip: "Add depth to profile photos and create soft, professional portraits",
    badge: null,
    href: "/blur-bg",
    accent: "text-rose-300",
    glow: "from-rose-500/20",
    category: "Core Tools",
  },
  {
    id: "sharpness",
    icon: Sparkles,
    title: "Sharpness",
    description: "Sharpen the subject or background separately for crisp exports.",
    tip: "Crisp up product edges and enhance fine details before listing",
    badge: "New",
    href: "/sharpness",
    accent: "text-amber-300",
    glow: "from-amber-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Crop images to exact aspect ratios for any platform.",
    tip: "Frame images perfectly for thumbnails, ads, and social feeds",
    badge: null,
    href: "/crop",
    accent: "text-lime-300",
    glow: "from-lime-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Fine-tune brightness, contrast, saturation, and compression.",
    tip: "Fine-tune brightness, contrast, and saturation for a consistent brand look",
    badge: null,
    href: "/adjust",
    accent: "text-cyan-300",
    glow: "from-cyan-500/20",
    category: "Adjustment Tools",
  },
  {
    id: "converter",
    icon: FileImage,
    title: "Format Converter",
    description: "Convert between PNG, JPG, WebP, AVIF, and TIFF formats.",
    tip: "Convert between formats for compatibility, archiving, or platform requirements",
    badge: "New",
    href: "/converter",
    accent: "text-indigo-300",
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
    title: "How AI Background Removal Works in 2026",
    excerpt: "Discover the technology behind modern background removal — from BiRefNet neural networks to real-time edge detection.",
    date: "May 2026",
    readTime: "8 min read",
    slug: "how-ai-background-removal-works",
    color: "from-sky-500/20",
  },
  {
    title: "10 Ways to Use Transparent PNGs for Amazon & Etsy",
    excerpt: "Maximize your product listings with transparent PNGs. From lifestyle mockups to infographics, learn the strategies top sellers use.",
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

const faqItems = [
  {
    q: "Which tool should I use first?",
    a: "Start with Background Remover to create a clean cutout, then use Smart Resize, Crop, or Background Replace depending on your output destination. Most workflows follow: remove → resize/crop → refine.",
  },
  {
    q: "Can I use multiple tools on the same image?",
    a: "Yes — QuickBG keeps your subject cutout as you move between tools. You can remove, resize, crop, replace the background, blur, and adjust in any order without starting over.",
  },
  {
    q: "Do I need to sign up to use the tools?",
    a: "No signup, no credit card, no limits. All tools are free to use. Export transparent PNGs at full resolution with no watermark.",
  },
  {
    q: "What image formats are supported across tools?",
    a: "All tools accept PNG, JPG, WebP, HEIC, and AVIF uploads. The Format Converter lets you export to any supported format including TIFF and AVIF.",
  },
];

const workflowTips = [
  {
    title: "E-commerce product photos",
    steps: ["Remove background for a clean cutout", "Resize to Amazon 1:1 or Etsy 4:3", "Replace with white or branded background", "Adjust brightness and contrast"],
    link: "/blog/ecommerce-product-photos-guide",
  },
  {
    title: "Social media content",
    steps: ["Remove background from portrait", "Crop to Instagram 4:5 or 1:1", "Blur background for depth effect", "Export as WebP for faster loading"],
    link: "/blog/transparent-pngs-amazon-etsy",
  },
  {
    title: "Product listing optimization",
    steps: ["Remove background with edge refinement", "Crop to focus on the subject", "Sharpen product edges", "Convert to PNG for transparency"],
    link: "/blog/how-ai-background-removal-works",
  },
];

const chooseGuide = [
  {
    goal: "I need a clean subject cutout",
    tool: "Background Remover",
    why: "AI-powered edge detection handles hair, fur, and complex boundaries.",
  },
  {
    goal: "I need specific dimensions",
    tool: "Smart Resize or Smart Crop",
    why: "Resize for exact pixel dimensions or crop to preset aspect ratios for platforms.",
  },
  {
    goal: "I want a styled background",
    tool: "Background Replace or Blur Background",
    why: "Replace adds colors/gradients/images; Blur creates depth while keeping context.",
  },
  {
    goal: "I need the image to pop",
    tool: "Adjust Image or Sharpness",
    why: "Adjust handles brightness/contrast/saturation; Sharpness refines edge detail.",
  },
  {
    goal: "I need a specific file format",
    tool: "Format Converter",
    why: "Convert to PNG, JPG, WebP, AVIF, or TIFF with quality controls.",
  },
];

export default function ToolsPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="tools-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ===== PAGE HEADER ===== */}
        <div className="mb-10 flex items-start gap-4">
          <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="mt-1 h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">QuickBG workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white sm:text-5xl">QuickBG Tools — Complete Image Editing Suite</h1>
            <p className="mt-2 text-sm text-white/50">
              Eight tools designed to work together. Remove backgrounds, resize, crop, adjust, and export — all in one workspace, no signup required.
            </p>
          </div>
        </div>

        {/* ===== RECOMMENDED WORKFLOW ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-lime-300" />
                Recommended workflow
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Remove the background first, then resize, crop, replace, blur, or adjust without leaving the QuickBG flow. The cutout stays intact as you move between tools.
              </p>
            </div>
            <Button onClick={() => router.push("/remover")} className="rounded-full bg-white text-black hover:bg-lime-200">
              Open remover
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
                {categoryTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => router.push(tool.href)}
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
                    <h3 className="relative mt-5 text-lg font-semibold text-white">{tool.title}</h3>
                    <p className="relative mt-2 text-sm leading-6 text-white/50">{tool.description}</p>
                    <div className="relative mt-3 flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                      <p className="text-xs leading-5 text-white/40">{tool.tip}</p>
                    </div>
                    <div className="relative mt-5 border-t border-white/10 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">{category.id.slice(0, -1)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* ===== HOW TO CHOOSE THE RIGHT TOOL ===== */}
        <div className="premium-surface mb-10 rounded-[1.75rem] p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Quick reference</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">How to Choose the Right Tool</h2>
            <p className="mt-2 text-sm text-white/50">Not sure where to start? Match your goal to the right tool.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chooseGuide.map((item) => (
              <div key={item.goal} className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">Your goal</p>
                <p className="mt-1 text-sm font-medium text-white">{item.goal}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-sky-300/80">Use</p>
                <p className="mt-1 text-sm font-medium text-white">{item.tool}</p>
                <p className="mt-2 text-xs leading-5 text-white/50">{item.why}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== WORKFLOW TIPS ===== */}
        <div className="mb-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Guides & templates</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Workflow Tips</h2>
            <p className="mt-2 text-sm text-white/50">Step-by-step recipes for common image editing scenarios.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workflowTips.map((wf) => (
              <Link
                key={wf.title}
                href={wf.link}
                className="premium-surface group relative overflow-hidden rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <h3 className="relative text-base font-semibold text-white">{wf.title}</h3>
                <ol className="relative mt-4 space-y-2">
                  {wf.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/50">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                  Read full guide <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== BLOG HIGHLIGHTS ===== */}
        <div className="mb-10">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Blog & articles</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Latest from the blog</h2>
              <p className="mt-2 text-sm text-white/50">Tips, tutorials, and deep dives into AI background removal and image editing.</p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              View all articles
              <BookOpen className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogHighlights.map((post) => (
              <Link
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
                <h3 className="relative mt-3 text-base font-semibold text-white transition group-hover:text-sky-200">{post.title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-white/50">{post.excerpt}</p>
                <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/40 transition group-hover:text-white">
                  Read article <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== FAQ ===== */}
        <div className="mb-6">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm text-white/50">Quick answers about choosing and using QuickBG tools.</p>
          </div>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqItems.map((item) => (
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
          <div className="mt-6">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              View all FAQs
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
