"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scissors, Maximize2, Palette, Layers, Crop, Contrast, ArrowLeft } from "lucide-react";

const tools = [
  {
    id: "remove-bg",
    icon: Scissors,
    title: "Background Remover",
    description: "Instantly remove backgrounds from any image",
    badge: "Core",
    href: "/remover",
    color: "from-primary to-blue-500",
  },
  {
    id: "resize",
    icon: Maximize2,
    title: "Smart Resize",
    description: "Resize to perfect dimensions",
    badge: "Popular",
    href: "/resize",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "replace-bg",
    icon: Palette,
    title: "Background Replace",
    description: "Replace with colors or images",
    badge: "New",
    href: "/replace-bg",
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "blur-bg",
    icon: Layers,
    title: "Blur Background",
    description: "Add blur effects to background",
    badge: null,
    href: "/blur-bg",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "crop",
    icon: Crop,
    title: "Smart Crop",
    description: "Crop to aspect ratios",
    badge: null,
    href: "/crop",
    color: "from-emerald-500 to-green-500",
  },
  {
    id: "adjust",
    icon: Contrast,
    title: "Adjust Image",
    description: "Brightness, contrast, saturation",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <button
                onClick={() => router.push(tool.href)}
                className="group relative flex flex-col items-center justify-start text-center w-full h-full p-8 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
              >
                {tool.badge && (
                  <span className={cn(
                    "absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r text-white shadow-md",
                    tool.badge === "Core" ? "from-primary to-blue-500" :
                    tool.badge === "Popular" ? "from-violet-500 to-purple-500" :
                    tool.badge === "New" ? "from-cyan-500 to-teal-500" :
                    "from-indigo-500 to-blue-600"
                  )}>
                    {tool.badge}
                  </span>
                )}

                <div className={cn(
                  "w-16 h-16 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                  tool.color
                )}>
                  <tool.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}