"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Scissors, Maximize2, Palette, Layers, Crop, Contrast, ArrowLeft } from "lucide-react";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image",
    bestFor: "Product photos, portraits, ecommerce",
    badge: "Core",
    href: "/remover",
    color: "from-primary to-blue-500",
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize to perfect dimensions",
    bestFor: "Social posts, ads, marketplaces",
    badge: "Popular",
    href: "/resize",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Replace with colors or images",
    bestFor: "Brand backgrounds and listings",
    badge: "New",
    href: "/replace-bg",
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Add blur effects to background",
    bestFor: "Profile photos and campaign creative",
    badge: null,
    href: "/blur-bg",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Crop to aspect ratios",
    bestFor: "Thumbnails, feeds, banners",
    badge: null,
    href: "/crop",
    color: "from-emerald-500 to-green-500",
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Brightness, contrast, saturation",
    bestFor: "Final polish and compression",
    badge: null,
    href: "/adjust",
    color: "from-blue-600 to-cyan-600",
  },
];

export default function ToolsPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">All Tools</h1>
            <p className="text-muted-foreground text-sm">Choose a tool to get started</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Workflow</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with background removal, then use editing tools to resize, crop, replace, blur, or export.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.id} className="group transition-colors hover:border-primary/50">
              <button
                onClick={() => router.push(tool.href)}
                className="relative flex h-full w-full flex-col items-start justify-start p-5 text-left"
              >
                {tool.badge && (
                  <Badge className="absolute right-4 top-4" variant={tool.badge === "Core" ? "default" : "secondary"}>
                    {tool.badge}
                  </Badge>
                )}

                <div className={cn(
                  "mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                  tool.color
                )}>
                  <tool.icon className="h-5 w-5" />
                </div>

                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <CardContent className="mt-4 p-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best for</p>
                  <p className="mt-1 text-sm">{tool.bestFor}</p>
                </CardContent>
              </button>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
