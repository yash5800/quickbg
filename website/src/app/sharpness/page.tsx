"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Circle, Download, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { ToolFaq, ToolExtraContent } from "@/components/tool-faq";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { RatingWidget } from "@/components/rating-widget";

type Target = "subject" | "background";
const MAX_PREVIEW_DIMENSION = 1400;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function sharpenImageData(source: ImageData, amount: number): ImageData {
  const { width, height, data } = source;
  const output = new ImageData(width, height);
  const out = output.data;
  const center = 1 + amount * 4;
  const side = -amount;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const current = data[index + channel] * center;
        const left = data[(y * width + Math.max(0, x - 1)) * 4 + channel] * side;
        const right = data[(y * width + Math.min(width - 1, x + 1)) * 4 + channel] * side;
        const top = data[(Math.max(0, y - 1) * width + x) * 4 + channel] * side;
        const bottom = data[(Math.min(height - 1, y + 1) * width + x) * 4 + channel] * side;
        out[index + channel] = Math.max(0, Math.min(255, current + left + right + top + bottom));
      }
      out[index + 3] = data[index + 3];
    }
  }

  return output;
}

export default function SharpnessPage() {
  const { t } = useLocale();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceOriginalRef = useRef<HTMLImageElement | null>(null);
  const sourceProcessedRef = useRef<HTMLImageElement | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("quickbg-image.png");
  const [target, setTarget] = useState<Target>("subject");
  const [amount, setAmount] = useState(0.6);
  const [isReady, setIsReady] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTimeoutRef = useRef<number | null>(null);

  const buildSharpenedCanvas = useCallback((opts: {
    original: HTMLImageElement;
    processed: HTMLImageElement;
    targetWidth: number;
    targetHeight: number;
    amountValue: number;
    targetValue: Target;
  }): HTMLCanvasElement => {
    const { original, processed, targetWidth, targetHeight, amountValue, targetValue } = opts;
    const work = document.createElement("canvas");
    work.width = targetWidth;
    work.height = targetHeight;
    const workCtx = work.getContext("2d");
    if (!workCtx) {
      throw new Error("Canvas context unavailable.");
    }

    workCtx.drawImage(original, 0, 0, targetWidth, targetHeight);
    const originalData = workCtx.getImageData(0, 0, targetWidth, targetHeight);
    const sharpened = sharpenImageData(originalData, amountValue);

    workCtx.clearRect(0, 0, targetWidth, targetHeight);
    workCtx.drawImage(processed, 0, 0, targetWidth, targetHeight);
    const maskData = workCtx.getImageData(0, 0, targetWidth, targetHeight);

    const finalData = new ImageData(targetWidth, targetHeight);
    for (let i = 0; i < finalData.data.length; i += 4) {
      const alpha = maskData.data[i + 3];
      const applyToPixel = targetValue === "subject" ? alpha > 8 : alpha <= 8;
      const source = applyToPixel ? sharpened.data : originalData.data;
      finalData.data[i] = source[i];
      finalData.data[i + 1] = source[i + 1];
      finalData.data[i + 2] = source[i + 2];
      finalData.data[i + 3] = 255;
    }

    workCtx.putImageData(finalData, 0, 0);
    return work;
  }, []);

  useEffect(() => {
    const original = sessionStorage.getItem("originalImage");
    const processed = sessionStorage.getItem("processedImage");
    const sourceFileName = sessionStorage.getItem("toolSourceFileName");
    if (original && processed) {
      setOriginalImage(original);
      setProcessedImage(processed);
      if (sourceFileName) {
        setFileName(sourceFileName);
      }
    }

    return () => {
      sessionStorage.removeItem("originalImage");
      sessionStorage.removeItem("processedImage");
      sessionStorage.removeItem("toolSourceFileName");
    };
  }, []);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    const original = sourceOriginalRef.current;
    const processed = sourceProcessedRef.current;
    if (!canvas || !original || !processed) return;

    setIsRendering(true);
    setError(null);

    try {
      const longestEdge = Math.max(original.naturalWidth, original.naturalHeight);
      const scale = longestEdge > MAX_PREVIEW_DIMENSION ? MAX_PREVIEW_DIMENSION / longestEdge : 1;
      const previewWidth = Math.max(1, Math.round(original.naturalWidth * scale));
      const previewHeight = Math.max(1, Math.round(original.naturalHeight * scale));

      canvas.width = previewWidth;
      canvas.height = previewHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const previewCanvas = buildSharpenedCanvas({
        original,
        processed,
        targetWidth: previewWidth,
        targetHeight: previewHeight,
        amountValue: amount,
        targetValue: target,
      });
      ctx.drawImage(previewCanvas, 0, 0);
      setIsReady(true);
      setIsLoaded(true);
    } catch (renderError) {
      const message = renderError instanceof Error ? renderError.message : "Failed to render sharpness preview.";
      setError(message);
    } finally {
      setIsRendering(false);
    }
  }, [amount, target, buildSharpenedCanvas]);

  useEffect(() => {
    if (!originalImage || !processedImage) return;

    let disposed = false;
    setIsLoaded(false);
    setIsReady(false);
    setError(null);

    Promise.all([loadImage(originalImage), loadImage(processedImage)])
      .then(([original, processed]) => {
        if (disposed) return;
        sourceOriginalRef.current = original;
        sourceProcessedRef.current = processed;
        void render();
      })
      .catch((loadError) => {
        if (disposed) return;
        const message = loadError instanceof Error ? loadError.message : "Failed to load image data.";
        setError(message);
      });

    return () => {
      disposed = true;
      sourceOriginalRef.current = null;
      sourceProcessedRef.current = null;
    };
  }, [originalImage, processedImage, render]);

  useEffect(() => {
    if (!sourceOriginalRef.current || !sourceProcessedRef.current) return;

    if (renderTimeoutRef.current !== null) {
      window.clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = window.setTimeout(() => {
      void render();
      renderTimeoutRef.current = null;
    }, 120);

    return () => {
      if (renderTimeoutRef.current !== null) {
        window.clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, [amount, target, render]);

  const download = async () => {
    const original = sourceOriginalRef.current;
    const processed = sourceProcessedRef.current;
    if (!original || !processed) return;

    setIsRendering(true);
    setError(null);

    let dataUrl: string;
    try {
      const fullCanvas = buildSharpenedCanvas({
        original,
        processed,
        targetWidth: original.naturalWidth,
        targetHeight: original.naturalHeight,
        amountValue: amount,
        targetValue: target,
      });
      dataUrl = fullCanvas.toDataURL("image/png");
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "Failed to generate download.";
      setError(message);
      setIsRendering(false);
      return;
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileName.split(".")[0]}-sharpness.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsRendering(false);
  };

  if (!processedImage || !originalImage) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <Button onClick={() => router.push("/remover")} variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("home.tools.sharpness")}</h1>
              <p className="text-sm text-muted-foreground">{t("home.tools.sharpnessDesc")}</p>
            </div>
          </div>

          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
              <Circle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t("sharpness.accessRestricted.heading")}</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              {t("sharpness.accessRestricted.desc")}
            </p>
            <Button onClick={() => router.push("/remover")} size="lg">
              {t("common.openRemover")}
            </Button>
          </div>

          <section className="mx-auto mb-20 mt-24 max-w-5xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("sharpness.guide.heading")}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">{t("tools.howToUse.sharpness")}</h2>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">1</span>
                <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step1Title")}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step1Desc")}</p>
              </div>
              <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">2</span>
                <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step2Title")}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step2Desc")}</p>
              </div>
              <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">3</span>
                <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step3Title")}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step3Desc")}</p>
              </div>
              <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">4</span>
                <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step4Title")}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step4Desc")}</p>
              </div>
            </div>
            </section>
            <ToolFaq toolKey="sharpness" />
            <ToolExtraContent toolKey="sharpness" />
          </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Button onClick={() => router.push("/remover")} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t("home.tools.sharpness")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.tools.sharpnessDesc")}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="premium-surface relative flex min-h-[520px] items-center justify-center rounded-xl p-4">
            <canvas
              ref={canvasRef}
              className={cn(
                "max-h-[70vh] max-w-full rounded-lg object-contain shadow-xl transition-opacity duration-200",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
              aria-hidden={!isLoaded}
            />

            {error ? (
              <div className="text-center text-red-500">
                <p>{t("sharpness.error")}: {error}</p>
              </div>
            ) : !isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-background/20">
                <img
                  src={processedImage || originalImage || ""}
                  alt="Sharpness preview placeholder"
                  className="h-full w-full object-contain opacity-75 blur-[1px] saturate-95"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/15 to-background/35" />
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-medium text-white/80 shadow-xl backdrop-blur-md">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t("sharpness.buildingPreview")}
                </div>
              </div>
            ) : null}

            {isLoaded && isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                <div className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs font-medium text-white/80 shadow-xl">
                  {t("sharpness.updatingPreview")}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="premium-surface rounded-xl p-5">
              <h2 className="font-semibold">{t("sharpness.target")}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["subject", "background"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTarget(value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm capitalize transition",
                      target === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    {t(`sharpness.${value}`)}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("sharpness.targetHelper")}
              </p>
            </div>

            <div className="premium-surface rounded-xl p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{t("sharpness.sectionTitle")}</h2>
                <span className="text-sm text-muted-foreground">{Math.round(amount * 100)}%</span>
              </div>
              <Slider type="range" min="0" max="1.5" step="0.05" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
              <p className="mt-3 text-xs text-muted-foreground">{t("sharpness.helperText")}</p>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={download} disabled={!isReady || isRendering}>
                <Download className="mr-2 h-4 w-4" />
                {t("remover.actions.download")}
              </Button>
            </div>

            {isReady && (
              <div className="pt-2">
                <RatingWidget tool="sharpness" />
              </div>
            )}

            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-4 w-4 text-primary" />
              {t("sharpness.tipText")}
            </div>
          </aside>
        </div>
      </div>

      <section className="mx-auto mb-20 mt-16 max-w-5xl border-t border-white/10 pt-12 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("sharpness.guide.heading")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">{t("tools.howToUse.sharpness")}</h2>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">1</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step1Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step1Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">2</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step2Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step2Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">3</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step3Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step3Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">4</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("sharpness.guide.step4Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("sharpness.guide.step4Desc")}</p>
          </div>
        </div>
      </section>
      <ToolFaq toolKey="sharpness" />
      <ToolExtraContent toolKey="sharpness" />
    </AppLayout>
  );
}
