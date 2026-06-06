"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Download, RefreshCw, Crop, ZoomIn, ZoomOut, Settings } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const aspectRatios = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4/3 },
  { label: "16:9", value: 16/9 },
  { label: "9:16", value: 9/16 },
  { label: "3:2", value: 3/2 },
];

export default function CropPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [image, setImage] = useState<{ preview: string; width: number; height: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Crop box state (in percentage)
  const [cropBox, setCropBox] = useState({ x: 25, y: 25, w: 50, h: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Load image from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("toolImages");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.length > 0) {
        const img = data[0];
        const imgEl = new Image();
        imgEl.onload = () => {
          // Ensure a newly-loaded image defaults to Free (full-frame) crop
          setAspectRatio(null);
          setImage({ preview: img.preview, width: imgEl.width, height: imgEl.height });
          updateCropBoxForAspectRatio(imgEl.width, imgEl.height, null);
        };
        imgEl.src = img.preview;
      }
      sessionStorage.removeItem("toolImages");
    }
  }, []);

  // When an image is set or aspect ratio/zoom changes, measure the displayed container
  // and update the crop box so it is centered on the visible image area.
  useEffect(() => {
    if (!image) return;
    // Measure after paint
    requestAnimationFrame(() => {
      const el = containerRef.current as HTMLDivElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const displayW = rect.width || image.width;
      const displayH = rect.height || image.height;
      updateCropBoxForAspectRatio(displayW, displayH, aspectRatio);
    });
  }, [image, aspectRatio, zoom]);

  const updateCropBoxForAspectRatio = (imgW: number, imgH: number, ratio: number | null) => {
    if (ratio === null) {
      setCropBox({ x: 0, y: 0, w: 100, h: 100 });
      return;
    }

    const imgRatio = imgW / imgH;
    let w, h;

    if (imgRatio > ratio) {
      // Image is wider than target ratio
      h = 80;
      w = h * ratio;
    } else {
      // Image is taller than target ratio
      w = 80;
      h = w / ratio;
    }

    const x = (100 - w) / 2;
    const y = (100 - h) / 2;

    setCropBox({ x, y, w, h });
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("toolImages");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.length > 0) {
        const img = data[0];
        const imgEl = new Image();
        imgEl.onload = () => {
          setImage({ preview: img.preview, width: imgEl.width, height: imgEl.height });
          updateCropBoxForAspectRatio(imgEl.width, imgEl.height, aspectRatio);
        };
        imgEl.src = img.preview;
      }
      sessionStorage.removeItem("toolImages");
    }
  }, [aspectRatio]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new window.Image();
      img.onload = () => {
        // Reset to Free crop on new upload
        setAspectRatio(null);
        setImage({ preview: URL.createObjectURL(file), width: img.width, height: img.height });
        setResult(null);
        setRotation(0);
        setZoom(1);
        updateCropBoxForAspectRatio(img.width, img.height, null);
      };
      img.src = URL.createObjectURL(file);
    }
    e.target.value = "";
  }, [aspectRatio]);

  // Mouse handlers for crop box
  type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const handleMouseDown = (e: React.MouseEvent, action: "move" | ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStart({ x: e.clientX, y: e.clientY });

    if (action === "move") {
      setIsDragging(true);
    } else {
      setIsResizing(action);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!image || (!isDragging && !isResizing)) return;

    const dx = (e.clientX - dragStart.x) * (100 / (containerRef.current?.offsetWidth || 1));
    const dy = (e.clientY - dragStart.y) * (100 / (containerRef.current?.offsetHeight || 1));

    setDragStart({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      setCropBox(prev => {
        let newX = prev.x + dx;
        let newY = prev.y + dy;

        newX = Math.max(0, Math.min(100 - prev.w, newX));
        newY = Math.max(0, Math.min(100 - prev.h, newY));

        return { ...prev, x: newX, y: newY };
      });
    } else if (isResizing) {
      const r = isResizing;
      setCropBox(prev => {
        let newX = prev.x;
        let newY = prev.y;
        let newW = prev.w;
        let newH = prev.h;

        if (r.includes("e")) newW = Math.max(10, Math.min(100 - newX, prev.w + dx));
        if (r.includes("w")) { newW = Math.max(10, prev.w - dx); newX = prev.x + dx; }
        if (r.includes("s")) newH = Math.max(10, Math.min(100 - newY, prev.h + dy));
        if (r.includes("n")) { newH = Math.max(10, prev.h - dy); newY = prev.y + dy; }

        // Maintain aspect ratio
        if (aspectRatio !== null && (r === "n" || r === "s" || r === "e" || r === "w")) {
          if (r === "n" || r === "s") {
            newW = newH * aspectRatio;
          } else {
            newH = newW / aspectRatio;
          }
        }

        // Constrain
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        newW = Math.min(100 - newX, newW);
        newH = Math.min(100 - newY, newH);

        return { x: newX, y: newY, w: newW, h: newH };
      });
    }
  }, [image, isDragging, isResizing, dragStart, aspectRatio]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    // Compute crop box in container coordinates, then map into the displayed image coordinates
    const containerEl = containerRef.current;
    const imgEl = imageRef.current;
    if (!containerEl || !imgEl) {
      setIsProcessing(false);
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const imageRect = imgEl.getBoundingClientRect();

    // Crop box in container pixels
    const cropLeft = containerRect.left + (cropBox.x / 100) * containerRect.width;
    const cropTop = containerRect.top + (cropBox.y / 100) * containerRect.height;
    const cropWpxDisplayed = (cropBox.w / 100) * containerRect.width;
    const cropHpxDisplayed = (cropBox.h / 100) * containerRect.height;

    // Compute intersection relative to the displayed image
    const relLeft = cropLeft - imageRect.left;
    const relTop = cropTop - imageRect.top;

    // Convert to fractions of the displayed image (clamped)
    const fracX = Math.max(0, Math.min(1, relLeft / imageRect.width));
    const fracY = Math.max(0, Math.min(1, relTop / imageRect.height));
    const fracW = Math.max(0, Math.min(1, cropWpxDisplayed / imageRect.width));
    const fracH = Math.max(0, Math.min(1, cropHpxDisplayed / imageRect.height));

    // Map to natural image pixels
    const natImg = new window.Image();
    natImg.crossOrigin = "anonymous";
    natImg.onload = () => {
      const natW = natImg.width;
      const natH = natImg.height;

      const cropXpx = fracX * natW;
      const cropYpx = fracY * natH;
      const cropWpx = fracW * natW;
      const cropHpx = fracH * natH;

      // Calculate rotated dimensions
      let finalW = cropWpx;
      let finalH = cropHpx;
      if (rotation !== 0) {
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        finalW = cropWpx * cos + cropHpx * sin;
        finalH = cropWpx * sin + cropHpx * cos;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = Math.max(1, Math.round(finalW));
      canvas.height = Math.max(1, Math.round(finalH));

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(natImg, cropXpx, cropYpx, cropWpx, cropHpx, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob!);
        setResult(url);
        setIsProcessing(false);
      }, "image/png");
    };
    natImg.src = image.preview;
  };

  return (
    <AppLayout>
      <input ref={fileInputRef} type="file" accept="image/*,.tif,.tiff,.heif,.heic,.avif" onChange={handleFileSelect} className="hidden" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={() => router.push("/tools")} variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Smart Crop</h1>
            <p className="text-muted-foreground text-sm">Drag to select area, then crop</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Crop Preview */}
          <div className="lg:col-span-2 space-y-4">
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
              <div className="relative rounded-2xl overflow-hidden bg-black premium-surface flex items-center justify-center">
                <div
                  ref={containerRef}
                  className="relative inline-block select-none overflow-hidden w-full"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={(el) => { imageRef.current = el; }}
                    src={image.preview}
                    alt=""
                    className="block max-w-full max-h-[60vh] w-auto h-auto mx-auto"
                    draggable={false}
                    style={{ transform: `scale(${zoom})` }}
                  />

                  {/* Crop overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom,
                        rgba(0,0,0,0.5) 0%,
                        rgba(0,0,0,0.5) ${cropBox.y}%,
                        transparent ${cropBox.y}%,
                        transparent ${cropBox.y + cropBox.h}%,
                        rgba(0,0,0,0.5) ${cropBox.y + cropBox.h}%,
                        rgba(0,0,0,0.5) 100%)`,
                    }}
                  />

                  {/* Crop box */}
                  <div
                    className="absolute border-2 border-white cursor-move"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, "move")}
                  >
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white/30" />
                      ))}
                    </div>

                    {["nw", "ne", "sw", "se"].map((pos) => (
                      <div
                        key={pos}
                        className={cn("absolute w-4 h-4 bg-white rounded-sm",
                          pos === "nw" ? "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize" :
                          pos === "ne" ? "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize" :
                          pos === "sw" ? "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize" :
                          "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize"
                        )}
                        onMouseDown={(e) => handleMouseDown(e, pos as ResizeHandle)}
                      />
                    ))}

                    {["n", "s", "e", "w"].map((pos) => (
                      <div
                        key={pos}
                        className={cn("absolute bg-white/50",
                          pos === "n" ? "top-0 left-2 right-2 h-1.5 -translate-y-1/2 cursor-n-resize" :
                          pos === "s" ? "bottom-0 left-2 right-2 h-1.5 translate-y-1/2 cursor-s-resize" :
                          pos === "e" ? "right-0 top-2 bottom-2 w-1.5 translate-x-1/2 cursor-e-resize" :
                          "left-0 top-2 bottom-2 w-1.5 -translate-x-1/2 cursor-w-resize"
                        )}
                        onMouseDown={(e) => handleMouseDown(e, pos as ResizeHandle)}
                      />
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* Render result preview below the main image so it doesn't compress the original */}
            {result && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold mb-2">Preview</h3>
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img src={result} alt="" className="w-full h-auto" />
                  <a href={result} download="cropped.png" className="absolute top-4 right-4">
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Aspect Ratio</h3>
              <div className="grid grid-cols-3 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      aspectRatio === ratio.value
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="font-semibold text-sm">{ratio.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Rotation ({rotation}°)</h3>
              <Slider
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              <p className="mt-3 text-xs text-muted-foreground">Rotate freely, then click Apply Crop to render the result.</p>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>-180°</span>
                <span>{rotation}°</span>
                <span>180°</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Zoom</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center font-medium">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
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
                  <Crop className="h-4 w-4 mr-2" />
                  Apply Crop
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <section className="mx-auto mb-20 mt-16 max-w-5xl border-t border-white/10 pt-12 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Guide</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">How to use Smart Crop</h2>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">1</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Upload your image</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">Upload any image you want to reframe or crop.</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">2</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Drag the crop box</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">Adjust the crop area by dragging the corners and edges.</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">3</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Choose aspect ratio</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">Lock to a specific ratio or crop free-form.</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">4</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Apply and download</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">Click Apply Crop and download the result.</p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}