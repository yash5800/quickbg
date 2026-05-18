"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Download, RefreshCw, Plus, Palette, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const backgroundColors = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#888888" },
  { name: "Red", value: "#ff4444" },
  { name: "Blue", value: "#4444ff" },
  { name: "Green", value: "#44ff44" },
];

const gradients = [
  { name: "Sunset", colors: ["#ff6b6b", "#feca57"] },
  { name: "Ocean", colors: ["#48dbfb", "#0abde3"] },
  { name: "Forest", colors: ["#1dd1a1", "#10ac84"] },
  { name: "Purple", colors: ["#a55eea", "#8854d0"] },
  { name: "Fire", colors: ["#ff9f43", "#ee5a24"] },
  { name: "Sky", colors: ["#54a0ff", "#2e86de"] },
];

export default function ReplaceBgPage() {
  const router = useRouter();
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState<"color" | "gradient" | "image">("color");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const orig = sessionStorage.getItem("originalImage");
    const proc = sessionStorage.getItem("processedImage");

    if (proc) {
      setProcessedImage(proc);
      sessionStorage.removeItem("processedImage");
    }

    if (orig) {
      setOriginalImage(orig);
      sessionStorage.removeItem("originalImage");
    }
  }, []);

  const handleBgImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundImage(URL.createObjectURL(file));
      setSelectedBg("image");
      setResult(null);
    }
    e.target.value = "";
  }, []);

  const processImage = async () => {
    if (!originalImage) return;
    setIsProcessing(true);

    const origImg = new window.Image();
    origImg.crossOrigin = "anonymous";

    await new Promise<void>((resolve) => {
      origImg.onload = () => resolve();
      origImg.src = originalImage;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = origImg.width;
    canvas.height = origImg.height;

    if (selectedBg === "color") {
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (selectedBg === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const [c1, c2] = gradients[selectedGradient].colors;
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (selectedBg === "image" && backgroundImage) {
      const bgImg = new window.Image();
      bgImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve) => {
        bgImg.onload = () => resolve();
        bgImg.src = backgroundImage;
      });

      const canvasAspect = canvas.width / canvas.height;
      const bgAspect = bgImg.width / bgImg.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let drawX = 0;
      let drawY = 0;

      if (bgAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * bgAspect;
        drawX = (canvas.width - drawWidth) / 2;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / bgAspect;
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
    }

    if (processedImage) {
      const procImg = new window.Image();
      procImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve) => {
        procImg.onload = () => resolve();
        procImg.src = processedImage;
      });

      ctx.drawImage(procImg, 0, 0);
    }

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!);
      setResult(url);
      setIsProcessing(false);
    }, "image/png");
  };

  if (!processedImage || !originalImage) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Button onClick={() => router.push("/remover")} variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Background Replace</h1>
              <p className="text-muted-foreground text-sm">Replace background with colors, gradients, or images</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Palette className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Please process an image with Background Remover first, then use the &ldquo;Replace BG&rdquo; button to access this tool.
            </p>
            <Button onClick={() => router.push("/remover")} size="lg">
              Go to Background Remover
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={() => router.push("/remover")} variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Background Replace</h1>
            <p className="text-muted-foreground text-sm">Replace background with colors, gradients, or images</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden premium-surface">
              {result ? (
                <img src={result} alt="" className="w-full h-full object-contain" />
              ) : (
                <img src={processedImage} alt="" className="w-full h-full object-contain" />
              )}
              {result && (
                <a href={result} download="replaced-bg.png" className="absolute top-4 right-4">
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              )}
            </div>

            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm">
              <span className="text-green-700 dark:text-green-400">Subject ready - background will be replaced</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Background Type</h3>
              <div className="flex gap-2">
                {(["color", "gradient", "image"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedBg(type);
                      setResult(null);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg capitalize transition-all",
                      selectedBg === type ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {selectedBg === "color" && (
              <div className="p-6 rounded-2xl premium-surface">
                <h3 className="font-semibold mb-4">Choose Color</h3>
                <div className="flex flex-wrap gap-3">
                  {backgroundColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        setSelectedColor(color.value);
                        setResult(null);
                      }}
                      style={{ backgroundColor: color.value }}
                      className={cn(
                        "w-12 h-12 rounded-xl border-2 transition-all",
                        selectedColor === color.value ? "border-primary ring-2 ring-primary/30" : "border-white/20"
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedBg === "gradient" && (
              <div className="p-6 rounded-2xl premium-surface">
                <h3 className="font-semibold mb-4">Choose Gradient</h3>
                <div className="flex flex-wrap gap-3">
                  {gradients.map((grad, idx) => (
                    <button
                      key={grad.name}
                      onClick={() => {
                        setSelectedGradient(idx);
                        setResult(null);
                      }}
                      className={cn(
                        "w-20 h-12 rounded-xl transition-all",
                        selectedGradient === idx ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                      )}
                      style={{ background: `linear-gradient(135deg, ${grad.colors[0]}, ${grad.colors[1]})` }}
                      title={grad.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedBg === "image" && (
              <div className="p-6 rounded-2xl premium-surface">
                <h3 className="font-semibold mb-4">Background Image</h3>
                {backgroundImage ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img src={backgroundImage} alt="" className="w-full h-full object-contain" />
                    <button
                      onClick={() => {
                        setBackgroundImage(null);
                        setResult(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById("bg-image-input")?.click()}
                    className="premium-dashed aspect-video rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                  >
                    <Plus className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload background</p>
                  </div>
                )}
                <input
                  id="bg-image-input"
                  type="file"
                  accept="image/*,.tif,.tiff,.heif,.heic,.avif"
                  onChange={handleBgImageSelect}
                  className="hidden"
                />
              </div>
            )}

            <Button
              onClick={processImage}
              disabled={isProcessing || (selectedBg === "image" && !backgroundImage)}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Replace Background
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
