"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Download, RefreshCw, Settings, Sun, Contrast, Palette, FileImage, Minimize2, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdjustPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [image, setImage] = useState<{ preview: string; name: string } | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Compression & format settings
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("jpeg");
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const [resizeEnabled, setResizeEnabled] = useState(false);

  // Load image from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("toolImages");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.length > 0) {
        setImage({ preview: data[0].preview, name: data[0].name });
      }
      sessionStorage.removeItem("toolImages");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ preview: URL.createObjectURL(file), name: file.name });
      setResult(null);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    }
    e.target.value = "";
  }, []);

  // Update preview on changes
  useEffect(() => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";

      const mimeType = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
      const dataUrl = canvas.toDataURL(mimeType, quality / 100);
      setResult(dataUrl);
    };
    img.src = image.preview;
  }, [image, brightness, contrast, saturation, format, quality]);

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);

    const imgEl = new window.Image();
    imgEl.crossOrigin = "anonymous";

    await new Promise<void>((resolve) => {
      imgEl.onload = () => resolve();
      imgEl.src = image.preview;
    });

    let finalWidth = imgEl.width;
    let finalHeight = imgEl.height;

    if (resizeEnabled && resizeWidth && resizeWidth > 0 && resizeWidth < imgEl.width) {
      const ratio = resizeWidth / imgEl.width;
      finalWidth = resizeWidth;
      finalHeight = Math.round(imgEl.height * ratio);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(imgEl, 0, 0, finalWidth, finalHeight);
    ctx.filter = "none";

    const mimeType = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!);
      setResult(url);
      setIsProcessing(false);
    }, mimeType, quality / 100);
  };

  const getFileExtension = () => format === "png" ? "png" : format === "jpeg" ? "jpg" : "webp";

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  return (
    <AppLayout>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={() => router.push("/tools")} variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Adjust & Compress</h1>
            <p className="text-muted-foreground text-sm">Adjust brightness, contrast, saturation, and compression</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview */}
          <div className="lg:col-span-2 space-y-4">
            {!image ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-border/50 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
              >
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold">Upload your image</p>
                <p className="text-sm text-muted-foreground mt-1">Click to select a file</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl overflow-hidden bg-muted border border-border/50">
                    <div className="p-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border/50">
                      Original
                    </div>
                    <div className="aspect-video flex items-center justify-center">
                      <img src={image.preview} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-muted border border-border/50">
                    <div className="p-2 bg-primary/10 text-xs font-medium text-primary border-b border-primary/20">
                      Processed
                    </div>
                    <div className="aspect-video flex items-center justify-center">
                      {result ? (
                        <img src={result} alt="" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-muted-foreground text-sm">Processing...</div>
                      )}
                    </div>
                  </div>
                </div>

                {result && (
                  <a href={result} download={`${image.name.split(".")[0]}_adjusted.${getFileExtension()}`}>
                    <Button className="w-full" size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      Download .{getFileExtension()}
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Adjustments */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Image Adjustments</h3>
                <Button variant="ghost" size="sm" onClick={resetAdjustments}>
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Sun className="h-4 w-4" />
                      Brightness
                    </label>
                    <span className="text-sm text-muted-foreground">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Contrast className="h-4 w-4" />
                      Contrast
                    </label>
                    <span className="text-sm text-muted-foreground">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="h-4 w-4" />
                      Saturation
                    </label>
                    <span className="text-sm text-muted-foreground">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>

            {/* Resize */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Minimize2 className="h-4 w-4" />
                  Resize
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resizeEnabled}
                    onChange={(e) => setResizeEnabled(e.target.checked)}
                    className="accent-primary"
                  />
                  Enable
                </label>
              </div>
              {resizeEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={resizeWidth || ""}
                    onChange={(e) => setResizeWidth(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Width"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              )}
            </div>

            {/* Format */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Output Format
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["png", "jpeg", "webp"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all uppercase",
                      format === f ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="font-semibold text-sm">.{f}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {format === "png" ? "Lossless, supports transparency" :
                 format === "jpeg" ? "Smaller size, no transparency" :
                 "Modern format, good compression"}
              </p>
            </div>

            {/* Quality */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Minimize2 className="h-4 w-4" />
                Quality ({quality}%)
              </h3>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>

            <Button onClick={processImage} disabled={!image || isProcessing} className="w-full" size="lg">
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Apply & Download
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}