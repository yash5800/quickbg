"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scissors, Maximize2, Palette, Layers, Crop, Contrast, ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image.",
    bestFor: "Product photos, portraits, ecommerce",
    badge: "Core",
    href: "/remover",
    accent: "text-sky-300",
    glow: "from-sky-500/20",
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize to perfect dimensions.",
    bestFor: "Social posts, ads, marketplaces",
    badge: "Popular",
    href: "/resize",
    accent: "text-violet-300",
    glow: "from-violet-500/20",
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Replace with colors or images.",
    bestFor: "Brand backgrounds and listings",
    badge: "New",
    href: "/replace-bg",
    accent: "text-emerald-300",
    glow: "from-emerald-500/20",
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Add blur effects to backgrounds.",
    bestFor: "Profile photos and campaign creative",
    badge: null,
    href: "/blur-bg",
    accent: "text-rose-300",
    glow: "from-rose-500/20",
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Crop to exact aspect ratios.",
    bestFor: "Thumbnails, feeds, banners",
    badge: null,
    href: "/crop",
    accent: "text-lime-300",
    glow: "from-lime-500/20",
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Brightness, contrast, saturation, and compression.",
    bestFor: "Final polish and optimized exports",
    badge: null,
    href: "/adjust",
    accent: "text-cyan-300",
    glow: "from-cyan-500/20",
  },
];

export default function ToolsPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">QuickBG workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white sm:text-5xl">All tools</h1>
            <p className="mt-2 text-sm text-white/50">Start with background removal, then refine the image for any channel.</p>
          </div>
        </div>

        <div className="premium-surface mb-6 rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-lime-300" />
                Recommended workflow
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Remove the background first, then resize, crop, replace, blur, or adjust without leaving the QuickBG flow.
              </p>
            </div>
            <Button onClick={() => router.push("/remover")} className="rounded-full bg-white text-black hover:bg-lime-200">
              Open remover
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
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
              <div className="relative mt-5 border-t border-white/10 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Best for</p>
                <p className="mt-1 text-sm text-white/70">{tool.bestFor}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
