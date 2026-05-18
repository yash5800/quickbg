"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, Maximize2, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const presets = [
  { label: "1:1", desc: "Square (Instagram, Profile)" },
  { label: "4:5", desc: "Portrait (Instagram Post)" },
  { label: "16:9", desc: "Landscape (YouTube, Banner)" },
  { label: "9:16", desc: "Story (Instagram, TikTok)" },
  { label: "2:3", desc: "Photo (Print)" },
  { label: "Custom", desc: "Your dimensions" },
];

export default function ResizePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [images, setImages] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("1:1");
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const [scale, setScale] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ id: string; url: string }[]>([]);

  // Load images from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("toolImages");
    if (stored) {
      const data = JSON.parse(stored);
      const loadedImages = data.map((img: { preview: string; name: string }) => ({
        id: Math.random().toString(36).slice(2, 9),
        file: new File([], img.name, { type: "image/*" }),
        preview: img.preview,
      }));
      setImages(loadedImages);
      sessionStorage.removeItem("toolImages");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        id: Math.random().toString(36).slice(2, 9),
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
    e.target.value = "";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        id: Math.random().toString(36).slice(2, 9),
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  }, []);

  const getDimensions = () => {
    if (selectedPreset === "Custom") return { width: customWidth, height: customHeight };
    const ratios: Record<string, [number, number]> = {
      "1:1": [1, 1],
      "4:5": [4, 5],
      "16:9": [16, 9],
      "9:16": [9, 16],
      "2:3": [2, 3],
    };
    const [w, h] = ratios[selectedPreset] || [1, 1];
    return { width: w * 100, height: h * 100 };
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    const dims = getDimensions();
    const targetWidth = Math.round(dims.width * (scale / 100));
    const targetHeight = Math.round(dims.height * (scale / 100));

    const processedResults = await Promise.all(
      images.map(async (img) => {
        return new Promise<{ id: string; url: string }>((resolve) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          const imgEl = new window.Image();
          imgEl.onload = () => {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.drawImage(imgEl, 0, 0, targetWidth, targetHeight);
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob!);
              resolve({ id: img.id, url });
            }, "image/png");
          };
          imgEl.src = img.preview;
        });
      })
    );

    setResults(processedResults);
    setIsProcessing(false);
  };

  const downloadAll = async () => {
    for (const result of results) {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = `resized-${result.id}.png`;
      a.click();
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  return (
    <AppLayout>
      <input ref={fileInputRef} type="file" accept="image/*,.tif,.tiff,.heif,.heic,.avif" multiple onChange={handleFileSelect} className="hidden" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={() => router.push("/")} variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Smart Resize</h1>
            <p className="text-muted-foreground text-sm">Resize images with AI-powered quality</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Aspect Ratio</h3>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(preset.label)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      selectedPreset === preset.label
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-xs text-muted-foreground">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset === "Custom" && (
              <div className="p-6 rounded-2xl premium-surface">
                <h3 className="font-semibold mb-4">Custom Dimensions</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/30"
                    placeholder="Width"
                  />
                  <span className="text-muted-foreground">×</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/30"
                    placeholder="Height"
                  />
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Scale ({scale}%)</h3>
              <input
                type="range"
                min="10"
                max="400"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>10%</span>
                <span>{scale}%</span>
                <span>400%</span>
              </div>
            </div>

            <Button onClick={processImages} disabled={images.length === 0 || isProcessing} className="w-full" size="lg">
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Resize {images.length} Image{images.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>

          {/* Image Area */}
          <div className="lg:col-span-2 space-y-6">
            <div
              data-drop-zone
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="premium-dashed rounded-[1.75rem] p-12 text-center cursor-pointer transition-all"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold">Click or drag images here</p>
              <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WebP supported</p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden premium-surface">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-destructive hover:bg-destructive/10"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Results ({results.length})</h3>
                  <Button onClick={downloadAll} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {results.map((result) => (
                    <div key={result.id} className="relative aspect-square rounded-xl overflow-hidden premium-surface">
                      <img src={result.url} alt="" className="w-full h-full object-cover" />
                      <a
                        href={result.url}
                        download={`resized-${result.id}.png`}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Download className="h-8 w-8 text-white" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}