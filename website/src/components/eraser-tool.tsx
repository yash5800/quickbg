"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Eraser, Undo2, RotateCcw, Download, X } from "lucide-react";
import getStroke from "perfect-freehand";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface EraserToolProps {
  processedImage: string;
  originalImage: string;
  onSave: (imageDataUrl: string) => void;
  onClose: () => void;
}

export function EraserTool({ processedImage, originalImage, onSave, onClose }: EraserToolProps) {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<"erase" | "restore">("erase");
  const [brushSize, setBrushSize] = useState(40);
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [undoDepth, setUndoDepth] = useState(1);

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const processedImgRef = useRef<HTMLImageElement | null>(null);
  const currentPathRef = useRef<Point[]>([]);
  const undoStackRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const canvasInitializedRef = useRef(false);
  const previewFrameRef = useRef<number | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  const getOptions = useCallback((size: number) => ({
    size: size,
    thinning: 0,
    smoothing: 0.28,
    streamline: 0.22,
    easing: (t: number) => t,
    simulatePressure: true,
    last: true,
  }), []);

  // Load images
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvasInitializedRef.current = false;

    Promise.all([
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = originalImage;
      }),
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = processedImage;
      }),
    ]).then(([origImg, procImg]) => {
      originalImgRef.current = origImg;
      processedImgRef.current = procImg;

      canvas.width = origImg.width;
      canvas.height = origImg.height;

      const maxWidth = window.innerWidth * 0.85;
      const maxHeight = window.innerHeight * 0.65;
      const scaleX = maxWidth / origImg.width;
      const scaleY = maxHeight / origImg.height;
      const newScale = Math.min(scaleX, scaleY, 1);

      setFitScale(newScale);
      canvas.style.width = `${origImg.width * newScale}px`;
      canvas.style.height = `${origImg.height * newScale}px`;

      // Same for preview canvas
      if (previewCanvasRef.current) {
        previewCanvasRef.current.width = origImg.width;
        previewCanvasRef.current.height = origImg.height;
        previewCanvasRef.current.style.width = canvas.style.width;
        previewCanvasRef.current.style.height = canvas.style.height;
      }

      ctx.drawImage(procImg, 0, 0);
      canvasInitializedRef.current = true;
      undoStackRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      setUndoDepth(1);
    });
  }, [processedImage, originalImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;

    const displayScale = fitScale * zoom;
    canvas.style.width = `${canvas.width * displayScale}px`;
    canvas.style.height = `${canvas.height * displayScale}px`;

    if (previewCanvas) {
      previewCanvas.style.width = canvas.style.width;
      previewCanvas.style.height = canvas.style.height;
    }
  }, [fitScale, zoom]);

  // Get canvas position
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / (fitScale * zoom),
      y: (clientY - rect.top) / (fitScale * zoom),
    };
  }, [fitScale, zoom]);

  // Draw preview stroke
  const drawPreviewStroke = useCallback((path: Point[]) => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || path.length < 2) return;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const stroke = getStroke(path, getOptions(brushSize));
    if (stroke.length < 2) return;

    ctx.save();
    ctx.fillStyle = mode === "erase" ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 255, 0, 0.3)";
    ctx.strokeStyle = mode === "erase" ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (let i = 1; i < stroke.length; i++) {
      const prev = stroke[i - 1];
      const curr = stroke[i];
      ctx.quadraticCurveTo(prev[0], prev[1], (prev[0] + curr[0]) / 2, (prev[1] + curr[1]) / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [mode, brushSize, getOptions]);

  const schedulePreviewDraw = useCallback(() => {
    if (previewFrameRef.current !== null) return;

    previewFrameRef.current = window.requestAnimationFrame(() => {
      previewFrameRef.current = null;
      drawPreviewStroke(currentPathRef.current);
    });
  }, [drawPreviewStroke]);

    // Apply stroke to canvas
  const applyStroke = useCallback((path: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas || path.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stroke = getStroke(path, getOptions(brushSize));
    if (stroke.length < 2) return;

    // Save undo state (limit to 15 levels to avoid memory pressure)
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStackRef.current.length > 15) {
      undoStackRef.current.shift();
    }
    setUndoDepth(undoStackRef.current.length);
    setHasChanges(true);

    ctx.save();

    // Create clip path
    ctx.beginPath();
    const first = stroke[0];
    ctx.moveTo(first[0], first[1]);
    for (let i = 1; i < stroke.length; i++) {
      const point = stroke[i];
      const prevPoint = stroke[i - 1];
      const midX = (prevPoint[0] + point[0]) / 2;
      const midY = (prevPoint[1] + point[1]) / 2;
      ctx.quadraticCurveTo(prevPoint[0], prevPoint[1], midX, midY);
    }
    ctx.closePath();

    if (mode === "erase") {
      // Make selected pixels transparent
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
    } else {
      // Restore: show original image
      ctx.globalCompositeOperation = "source-over";
      if (originalImgRef.current) {
        ctx.clip();
        ctx.drawImage(originalImgRef.current, 0, 0);
      }
    }

    ctx.restore();
  }, [mode, brushSize, getOptions]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canvasInitializedRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      pinchStartRef.current = {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        zoom,
      };
      isDrawingRef.current = false;
      currentPathRef.current = [];
      return;
    }

    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;

    isDrawingRef.current = true;
    currentPathRef.current = [{ x: pos.x, y: pos.y, pressure: 0.5 }];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [getCanvasPos, zoom]);

  const pointerMoveThrottleRef = useRef(false);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size >= 2 && pinchStartRef.current) {
      e.preventDefault();
      const [first, second] = Array.from(activePointersRef.current.values());
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (pinchStartRef.current.distance > 0) {
        handleZoomChange(pinchStartRef.current.zoom * (distance / pinchStartRef.current.distance));
      }
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Throttle cursor position updates to ~60fps
    if (!pointerMoveThrottleRef.current) {
      pointerMoveThrottleRef.current = true;
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (!isDrawingRef.current || !canvasInitializedRef.current) return;

    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;

    const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
    const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);

    if (dist > 2) {
      currentPathRef.current.push({ x: pos.x, y: pos.y, pressure: 0.5 });
      schedulePreviewDraw();
    }
  }, [getCanvasPos, schedulePreviewDraw]);

  // Reset cursor throttle on each frame (only when not drawing)
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      pointerMoveThrottleRef.current = false;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePointerUp = useCallback((e?: React.PointerEvent) => {
    if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (e) {
      activePointersRef.current.delete(e.pointerId);
    }
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (previewFrameRef.current !== null) {
      window.cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    }

    if (currentPathRef.current.length > 1) {
      // Clear preview
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        const ctx = previewCanvas.getContext("2d");
        ctx?.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }

      // Apply the stroke
      applyStroke(currentPathRef.current);
    }

    isDrawingRef.current = false;
    currentPathRef.current = [];
  }, [applyStroke]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    setCursorPos(null);
    if (isDrawingRef.current) {
      handlePointerUp(e);
    }
  }, [handlePointerUp]);

  const handleUndo = () => {
    if (undoStackRef.current.length <= 1) return;
    undoStackRef.current.pop();
    const lastState = undoStackRef.current[undoStackRef.current.length - 1];
    if (lastState) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.putImageData(lastState, 0, 0);
      }
    }
    setUndoDepth(undoStackRef.current.length);
  };

  const handleReset = () => {
    if (!processedImgRef.current || !canvasRef.current || !canvasInitializedRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(processedImgRef.current, 0, 0);
    undoStackRef.current = [ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)];
    setUndoDepth(1);
    setHasChanges(false);
  };

  const handleZoomChange = (value: number) => {
    setZoom(Math.min(3, Math.max(0.5, value)));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleUndo();
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const displayScale = fitScale * zoom;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-stretch justify-center p-0 sm:items-center sm:p-4">
      <div className="bg-card rounded-none sm:rounded-2xl shadow-2xl w-full h-[100dvh] sm:h-auto sm:max-w-6xl sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eraser className="h-5 w-5" />
            <h2 className="text-base sm:text-lg font-semibold">{t("eraser.title")}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-border bg-muted/30 sm:flex-row sm:items-center sm:gap-6 sm:flex-wrap">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button
              variant={mode === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("erase")}
            >
              <Eraser className="h-4 w-4 mr-2" />
              {t("eraser.erase")}
            </Button>
            <Button
              variant={mode === "restore" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("restore")}
              className={mode === "restore" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {t("eraser.restore")}
            </Button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border" />

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto sm:flex-none">
            <span className="text-sm text-muted-foreground font-medium shrink-0">{t("eraser.size")}:</span>
            <Slider
              type="range"
              min="10"
              max="300"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full sm:w-48 cursor-pointer"
            />
            <span className="text-sm font-semibold w-14 shrink-0 text-center bg-muted px-2 py-1 rounded-md">
              {brushSize}px
            </span>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border" />

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoDepth <= 1}>
              <Undo2 className="h-4 w-4 mr-2" />
              {t("eraser.undo")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("eraser.reset")}
            </Button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border" />

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:min-w-[280px] sm:flex-none">
            <span className="text-sm text-muted-foreground font-medium shrink-0">{t("eraser.zoom")}:</span>
            <Slider
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="w-full sm:w-40 cursor-pointer"
            />
            <span className="text-sm font-semibold w-14 shrink-0 text-center bg-muted px-2 py-1 rounded-md">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={() => handleZoomChange(1)}>
              Fit
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-6 bg-muted/20 flex items-center justify-center overscroll-contain">
          <div
            className="relative cursor-none select-none max-w-full max-h-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          >
            <canvas ref={canvasRef} className="rounded-lg shadow-xl" />
            <canvas
              ref={previewCanvasRef}
              className="absolute top-0 left-0 rounded-lg pointer-events-none"
            />

            {/* Brush cursor */}
            {cursorPos && (
              <div
                className={cn(
                  "absolute border-2 rounded-full pointer-events-none",
                  mode === "erase" ? "border-red-500" : "border-green-500"
                )}
                style={{
                  width: `${brushSize * displayScale}px`,
                  height: `${brushSize * displayScale}px`,
                  left: `${cursorPos.x - (brushSize * displayScale) / 2}px`,
                  top: `${cursorPos.y - (brushSize * displayScale) / 2}px`,
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-5 h-5 rounded-full", mode === "erase" ? "bg-red-500" : "bg-green-500")} />
            <p className="text-sm text-muted-foreground">
              {mode === "erase" ? "Draw to remove pixels (make transparent)" : "Draw over missing areas to restore from the original image"}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
