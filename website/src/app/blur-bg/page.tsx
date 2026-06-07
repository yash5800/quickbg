"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, RefreshCw, Circle, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import { canvasRGB } from "stackblur-canvas";
import { useLocale } from "@/contexts/LocaleContext";

export default function BlurBgPage() {
  const { t } = useLocale();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [blurStrength, setBlurStrength] = useState(20);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const origImgRef = useRef<HTMLImageElement | null>(null);
  const procImgRef = useRef<HTMLImageElement | null>(null);
  const renderTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const orig = sessionStorage.getItem("originalImage");
    const proc = sessionStorage.getItem("processedImage");

    if (proc) setProcessedImage(proc);
    if (orig) setOriginalImage(orig);
  }, []);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("processedImage");
      sessionStorage.removeItem("originalImage");
    };
  }, []);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }, []);

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !origImgRef.current || !procImgRef.current) return false;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const w = origImgRef.current.width;
    const h = origImgRef.current.height;
    canvas.width = w;
    canvas.height = h;

    // Clear and draw original
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(origImgRef.current, 0, 0);

    // Apply blur using the canvas method
    if (blurStrength > 0) {
      try {
        canvasRGB(canvas, 0, 0, w, h, blurStrength);
      } catch (e) {
        console.error("StackBlur error:", e);
      }
    }

    // Draw subject on top (sharp, no blur)
    ctx.drawImage(procImgRef.current, 0, 0);

    return true;
  }, [blurStrength]);

  useEffect(() => {
    if (!processedImage || !originalImage) return;

    setIsLoaded(false);
    setError(null);

    Promise.all([loadImage(originalImage), loadImage(processedImage)])
      .then(([orig, proc]) => {
        console.log("Images loaded:", orig.width, "x", orig.height, proc.width, "x", proc.height);
        origImgRef.current = orig;
        procImgRef.current = proc;
        setIsLoaded(true);

        const success = renderCanvas();
        console.log("Render success:", success);
      })
      .catch((err) => {
        console.error("Image load error:", err);
        setError(err.message);
      });
  }, [processedImage, originalImage, loadImage]);

  useEffect(() => {
    if (!isLoaded) return;

    setIsRendering(true);

    if (renderTimeoutRef.current !== null) {
      window.clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = window.setTimeout(() => {
      renderCanvas();
      setIsRendering(false);
      renderTimeoutRef.current = null;
    }, 120);

    return () => {
      if (renderTimeoutRef.current !== null) {
        window.clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, [isLoaded, blurStrength, renderCanvas]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "blurred-bg.png";
    a.click();
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
              <h1 className="text-2xl font-bold">{t("home.tools.blurBg")}</h1>
              <p className="text-muted-foreground text-sm">{t("home.tools.blurBgDesc")}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Circle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Please process an image with Background Remover first, then use the &ldquo;Blur BG&rdquo; button to access this tool.
            </p>
            <Button onClick={() => router.push("/remover")} size="lg">
              {t("common.openRemover")}
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
            <h1 className="text-2xl font-bold">{t("home.tools.blurBg")}</h1>
            <p className="text-muted-foreground text-sm">{t("home.tools.blurBgDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden premium-surface flex items-center justify-center">
              {error ? (
                <div className="text-center text-red-500">
                  <p>Error: {error}</p>
                </div>
              ) : !isLoaded ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
              )}
              {isLoaded && isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                  <div className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs font-medium text-white/80 shadow-xl">
                    Updating preview...
                  </div>
                </div>
              )}
              {isLoaded && (
                <Button
                  onClick={handleDownload}
                  className="absolute top-4 right-4"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("remover.actions.download")}
                </Button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm">
              <span className="text-green-700 dark:text-green-400">Subject is sharp - background will be blurred</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl premium-surface">
              <h3 className="font-semibold mb-4">Blur Strength ({blurStrength}px)</h3>
              <Slider
                type="range"
                min="0"
                max="50"
                value={blurStrength}
                onChange={(e) => setBlurStrength(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{t("blurBg.sharp")}</span>
                <span>{t("blurBg.blurred")}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">The preview updates automatically after you release the slider.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto mb-20 mt-16 max-w-5xl border-t border-white/10 pt-12 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("blurBg.guide.heading")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">{t("tools.howToUse.blurBg")}</h2>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">1</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("blurBg.guide.step1Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("blurBg.guide.step1Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">2</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("blurBg.guide.step2Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("blurBg.guide.step2Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">3</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("blurBg.guide.step3Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("blurBg.guide.step3Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">4</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("blurBg.guide.step4Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("blurBg.guide.step4Desc")}</p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

