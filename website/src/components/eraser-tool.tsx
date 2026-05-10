"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Eraser, Undo2, RotateCcw, Download, X, Loader2 } from "lucide-react";
import getStroke from "perfect-freehand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<"erase" | "restore">("erase");
  const [brushSize, setBrushSize] = useState(40);
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const processedImgRef = useRef<HTMLImageElement | null>(null);
  const currentPathRef = useRef<Point[]>([]);
  const undoStackRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const canvasInitializedRef = useRef(false);

  const getOptions = useCallback((size: number) => ({
    size: size,
    thinning: 0,
    smoothing: 0.5,
    streamline: 0.5,
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

      setScale(newScale);
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
    });
  }, [processedImage, originalImage]);

  // Get canvas position
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, [scale]);

  // Draw preview stroke
  const drawPreviewStroke = useCallback((path: Point[]) => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (path.length < 2) return;

    const stroke = getStroke(path, getOptions(brushSize));
    if (stroke.length < 2) return;

    ctx.save();
    ctx.fillStyle = mode === "erase" ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 255, 0, 0.3)";
    ctx.strokeStyle = mode === "erase" ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 2;

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
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [mode, brushSize, getOptions]);

  // Apply stroke to canvas
  const applyStroke = useCallback(async (path: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas || path.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsProcessing(true);

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 100));

    const stroke = getStroke(path, getOptions(brushSize));
    if (stroke.length < 2) {
      setIsProcessing(false);
      return;
    }

    // Save undo state
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
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
    setIsProcessing(false);
  }, [mode, brushSize, getOptions]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canvasInitializedRef.current) return;
    e.preventDefault();

    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;

    isDrawingRef.current = true;
    currentPathRef.current = [{ x: pos.x, y: pos.y, pressure: 0.5 }];
  }, [getCanvasPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (!isDrawingRef.current || !canvasInitializedRef.current) return;

    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;

    const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
    const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);

    if (dist > 3) {
      currentPathRef.current.push({ x: pos.x, y: pos.y, pressure: 0.5 });
      drawPreviewStroke(currentPathRef.current);
    }
  }, [getCanvasPos, drawPreviewStroke]);

  const handlePointerUp = useCallback(async () => {
    if (currentPathRef.current.length > 1) {
      // Clear preview
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        const ctx = previewCanvas.getContext("2d");
        ctx?.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }

      // Apply the stroke
      await applyStroke(currentPathRef.current);
    }

    isDrawingRef.current = false;
    currentPathRef.current = [];
  }, [applyStroke]);

  const handlePointerLeave = useCallback(() => {
    setCursorPos(null);
    if (isDrawingRef.current) {
      handlePointerUp();
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
  };

  const handleReset = () => {
    if (!processedImgRef.current || !canvasRef.current || !canvasInitializedRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(processedImgRef.current, 0, 0);
    undoStackRef.current = [ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)];
    setHasChanges(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eraser className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Magic Edit</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-6 p-4 border-b border-border bg-muted/30 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("erase")}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Erase
            </Button>
            <Button
              variant={mode === "restore" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("restore")}
            >
              Restore
            </Button>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">Size:</span>
            <input
              type="range"
              min="10"
              max="300"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-48 accent-primary"
            />
            <span className="text-sm font-semibold w-14 text-center bg-muted px-2 py-1 rounded-md">
              {brushSize}px
            </span>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoStackRef.current.length <= 1}>
              <Undo2 className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-6 bg-muted/20 flex items-center justify-center">
          <div
            className="relative cursor-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          >
            <canvas ref={canvasRef} className="rounded-lg shadow-xl" />
            <canvas
              ref={previewCanvasRef}
              className="absolute top-0 left-0 rounded-lg pointer-events-none"
            />

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <div className="bg-background/90 rounded-xl px-6 py-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Applying changes...</span>
                </div>
              </div>
            )}

            {/* Brush cursor */}
            {cursorPos && (
              <div
                className={cn(
                  "absolute border-2 rounded-full pointer-events-none transition-all duration-75",
                  mode === "erase" ? "border-red-500" : "border-green-500"
                )}
                style={{
                  width: `${brushSize * scale}px`,
                  height: `${brushSize * scale}px`,
                  left: `${cursorPos.x - (brushSize * scale) / 2}px`,
                  top: `${cursorPos.y - (brushSize * scale) / 2}px`,
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-5 h-5 rounded-full", mode === "erase" ? "bg-red-500" : "bg-green-500")} />
            <p className="text-sm text-muted-foreground">
              {mode === "erase" ? "Draw to remove pixels (make transparent)" : "Draw to restore original background"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Download className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}