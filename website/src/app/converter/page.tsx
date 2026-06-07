"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FileImage, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
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
            <h1 className="text-3xl font-bold">Format Converter</h1>
            <p className="mt-1 text-sm text-muted-foreground">Convert PNG, JPG, WebP, AVIF, and TIFF exports.</p>
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
                <span className="font-semibold">Upload an image</span>
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
              <Button variant="outline" onClick={() => inputRef.current?.click()}>Change</Button>
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
    </AppLayout>
  );
}
