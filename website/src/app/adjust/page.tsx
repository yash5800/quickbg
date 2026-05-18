"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Download, RefreshCw, Settings, Sun, Contrast, Palette, FileImage, Minimize2, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdjustPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetSizeValue, setTargetSizeValue] = useState<number | null>(null);
  const [targetSizeUnit, setTargetSizeUnit] = useState<"KB" | "MB">("KB");
  const [finalSize, setFinalSize] = useState<string | null>(null);

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

    const compressByQuality = async (canvasEl: HTMLCanvasElement, mime: string, targetBytes: number | null) => {
      // If no target requested, just export with current quality
      if (!targetBytes) {
        return await new Promise<Blob | null>((resolve) => {
          canvasEl.toBlob((blob) => resolve(blob), mime, quality / 100);
        });
      }

      // Binary search over quality between 10 and 100 (inclusive)
      let low = 10;
      let high = 100;
      let best: Blob | null = null;
      let bestSize = Infinity;

      for (let i = 0; i < 9; i++) {
        const q = Math.round((low + high) / 2);
        // PNG ignores quality parameter; still attempt
        // eslint-disable-next-line no-await-in-loop
        const blob = await new Promise<Blob | null>((resolve) => {
          canvasEl.toBlob((b) => resolve(b), mime, q / 100);
        });
        if (!blob) break;
        const size = blob.size;
        if (size <= targetBytes) {
          // success, try higher quality
          best = blob;
          bestSize = size;
          low = q + 1;
        } else {
          // too large, reduce quality
          if (size < bestSize) {
            best = blob;
            bestSize = size;
          }
          high = q - 1;
        }
        if (low > high) break;
      }

      return best;
    };

    const targetBytes = targetEnabled && targetSizeValue ? (targetSizeUnit === "KB" ? targetSizeValue * 1024 : targetSizeValue * 1024 * 1024) : null;

    const blob = await compressByQuality(canvas, mimeType, targetBytes);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setResult(url);
      setFinalSize(`${(blob.size / 1024).toFixed(1)} KB`);
    } else {
      // fallback: export with requested quality
      await new Promise<void>((resolve) => {
        canvas.toBlob((b) => {
          const url = URL.createObjectURL(b!);
          setResult(url);
          setFinalSize(b ? `${(b.size / 1024).toFixed(1)} KB` : null);
          resolve();
        }, mimeType, quality / 100);
      });
    }
    setIsProcessing(false);
  };

  const getFileExtension = () => format === "png" ? "png" : format === "jpeg" ? "jpg" : "webp";

  // Reset adjustments handler is inline in the Reset button above

  return (
    <AppLayout>
      <input ref={fileInputRef} type="file" accept="image/*,.tif,.tiff,.heif,.heic,.avif" onChange={handleFileSelect} className="hidden" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={() => router.push("/tools")} variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Adjust & Compress</h1>
            <p className="text-sm text-muted-foreground mt-1">Fine-tune image appearance, resize, and export optimized files.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Preview & Upload */}
          <div className="lg:col-span-8 space-y-4">
            {!image ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="premium-dashed rounded-[1.75rem] p-12 text-center cursor-pointer transition-all"
                aria-hidden
              >
                <div className="flex flex-col items-center justify-center">
                  <Settings className="h-14 w-14 mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold">Upload your image</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">Supported formats: JPG, PNG, WebP.</p>
                  <div className="mt-6 flex gap-3">
                    <Button variant="default" onClick={() => fileInputRef.current?.click()}>Select Image</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl overflow-hidden premium-surface">
                    <div className="px-4 py-3 bg-white/[0.035] border-b border-white/10 text-sm font-medium">Original</div>
                    <div className="p-6 flex items-center justify-center bg-gradient-to-b from-white/3 via-transparent to-transparent">
                      <img src={image.preview} alt="original" className="max-w-full max-h-80 object-contain" />
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden premium-surface relative">
                    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.035] border-b border-white/10">
                      <div className="text-sm font-medium text-primary">Processed</div>
                      <div className="flex items-center gap-2">
                        {result && (
                          <a href={result} download={`${image.name.split(".")[0]}_adjusted.${getFileExtension()}`}>
                            <Button size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex items-center justify-center bg-gradient-to-b from-white/3 via-transparent to-transparent">
                      {result ? (
                        <img src={result} alt="processed" className="max-w-full max-h-80 object-contain" />
                      ) : (
                        <div className="text-muted-foreground text-sm text-center max-w-sm">
                          Adjust the sliders, then click Apply Changes to render the preview.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Filename: <span className="text-muted-foreground/90 font-medium">{image.name}</span></div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setImage(null); setResult(null); }}>Change</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setResult(null); setBrightness(100); setContrast(100); setSaturation(100); }}>Reset</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <aside className="lg:col-span-4 space-y-6 sticky top-24 self-start">
            <div className="p-5 rounded-xl premium-surface">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Image Adjustments</h3>
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
                    className="w-full accent-primary cursor-pointer"
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
                    className="w-full accent-primary cursor-pointer"
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
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl premium-surface">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Minimize2 className="h-4 w-4" /> Resize</h3>
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
                    placeholder="Width (px)"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-black/30"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl premium-surface">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FileImage className="h-4 w-4" /> Output</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(["png", "jpeg", "webp"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "p-2 rounded-lg text-sm transition-all uppercase",
                      format === f ? "ring-2 ring-primary/30 bg-primary/5" : "premium-surface hover:border-primary/30"
                    )}
                  >
                    <div className="font-medium">.{f}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {format === "png" ? "Lossless, supports transparency" :
                 format === "jpeg" ? "Smaller size, no transparency" :
                 "Modern format, good compression"}
              </p>
            </div>

            <div className="p-5 rounded-xl premium-surface">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Quality <span className="text-sm text-muted-foreground">({quality}%)</span></h3>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>

            <div className="p-5 rounded-xl premium-surface">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Target Size</h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetEnabled}
                    onChange={(e) => setTargetEnabled(e.target.checked)}
                    className="accent-primary"
                  />
                  Enable
                </label>
              </div>

              {targetEnabled ? (
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="number"
                    min={1}
                    value={targetSizeValue ?? ""}
                    onChange={(e) => setTargetSizeValue(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Size"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-white/10 bg-black/30"
                  />
                  <select className="w-20 px-2 py-2 rounded-lg border border-white/10 bg-black/30" value={targetSizeUnit} onChange={(e) => setTargetSizeUnit(e.target.value as "KB" | "MB")}>
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Enable to attempt compressing output to a target size (best-effort).</p>
              )}
              {finalSize && <div className="text-xs text-muted-foreground mt-2">Last export: {finalSize}</div>}
            </div>

            <div className="mt-4">
              <Button onClick={processImage} disabled={!image || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}