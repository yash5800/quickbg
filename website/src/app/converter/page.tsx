"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FileImage, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { convertFormat, downloadBlob } from "@/lib/image-operations";
import { cn } from "@/lib/utils";
import { RatingWidget } from "@/components/rating-widget";

type OutputFormat = "png" | "jpeg" | "webp" | "avif" | "tiff";

const descriptions: Record<OutputFormat, string> = {
  png: "Lossless and keeps transparency. Best for cutouts and graphics.",
  jpeg: "Small, widely supported, and best for photos. No transparency.",
  webp: "Modern compression with transparency support in most browsers.",
  avif: "Very small files with strong compression. Newer browser support.",
  tiff: "High-quality archive format for print and production workflows.",
};

function extension(format: OutputFormat) {
  return format === "jpeg" ? "jpg" : format;
}

export default function ConverterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(85);
  const [result, setResult] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("toolImages");
    if (!stored) return;

    try {
      const data = JSON.parse(stored) as Array<{ preview: string; name: string }>;
      const first = data[0];
      if (!first?.preview) return;

      fetch(first.preview)
        .then((response) => response.blob())
        .then((blob) => {
          setFile(new File([blob], first.name || "quickbg-image.png", { type: blob.type || "image/png" }));
          setPreview(first.preview);
        });
    } finally {
      sessionStorage.removeItem("toolImages");
    }
  }, []);

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setResult(null);
    event.target.value = "";
  };

  const convert = async () => {
    if (!file) return;
    setIsConverting(true);
    try {
      const blob = await convertFormat(file, format, quality);
      setResult(blob);
    } finally {
      setIsConverting(false);
    }
  };

  const download = async () => {
    if (!result || !file) return;
    await downloadBlob(result, `${file.name.split(".")[0]}.${extension(format)}`);
  };

  return (
    <AppLayout>
      <input ref={inputRef} type="file" accept="image/*,.tif,.tiff,.heif,.heic,.avif" className="hidden" onChange={selectFile} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Button onClick={() => router.push("/tools")} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t("home.tools.converter")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.tools.converterDesc")}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="premium-surface flex min-h-[460px] items-center justify-center rounded-xl p-4">
            {preview ? (
              <img src={preview} alt="Selected image" className="max-h-[65vh] max-w-full rounded-lg object-contain" />
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex min-h-[380px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"
              >
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <span className="font-semibold">{t("home.howItWorksSteps.upload")}</span>
                <span className="mt-2 text-sm text-muted-foreground">Choose output format and quality.</span>
              </button>
            )}
          </div>

          <aside className="space-y-4">
            <div className="premium-surface rounded-xl p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><FileImage className="h-4 w-4" /> Output format</h2>
              <div className="grid grid-cols-2 gap-2">
                {(["png", "jpeg", "webp", "avif", "tiff"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFormat(item)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm uppercase transition",
                      format === item ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    {extension(item)}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{descriptions[format]}</p>
            </div>

            <div className="premium-surface rounded-xl p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">Quality</h2>
                <span className="text-sm text-muted-foreground">{quality}%</span>
              </div>
              <Slider type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()}>{t("converter.change")}</Button>
              <Button onClick={() => void convert()} disabled={!file || isConverting}>
                {isConverting ? "Converting..." : "Convert"}
              </Button>
            </div>

            {result && (
              <>
                <Button className="w-full" onClick={() => void download()}>
                  <Download className="mr-2 h-4 w-4" />
                  Download .{extension(format)}
                </Button>
                <RatingWidget tool="converter" />
              </>
            )}
          </aside>
        </div>
      </div>

      <section className="mx-auto mb-20 mt-16 max-w-5xl border-t border-white/10 pt-12 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("converter.guide.heading")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">{t("tools.howToUse.converter")}</h2>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">1</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("converter.guide.step1Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("converter.guide.step1Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">2</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("converter.guide.step2Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("converter.guide.step2Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">3</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("converter.guide.step3Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("converter.guide.step3Desc")}</p>
          </div>
          <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">4</span>
            <h3 className="mt-3 text-sm font-semibold text-white">{t("converter.guide.step4Title")}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/50">{t("converter.guide.step4Desc")}</p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
