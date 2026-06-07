"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const ReactCompareSlider = dynamic(
  () => import("react-compare-slider").then((m) => m.ReactCompareSlider),
  { ssr: false }
);

interface LoadState {
  beforeLoaded: boolean;
  afterLoaded: boolean;
}

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Background Removed",
  className,
}: ComparisonSliderProps) {
  const { t } = useLocale();
  const [loaded, setLoaded] = React.useState<LoadState>({ beforeLoaded: false, afterLoaded: false });

  // Reset load state when images change
  React.useEffect(() => {
    setLoaded({ beforeLoaded: false, afterLoaded: false });
  }, [beforeImage, afterImage]);

  React.useEffect(() => {
    let beforeImg: HTMLImageElement | null = new Image();
    beforeImg.src = beforeImage;
    beforeImg.onload = () => setLoaded((s) => ({ ...s, beforeLoaded: true }));
    beforeImg.onerror = () => setLoaded((s) => ({ ...s, beforeLoaded: true }));

    let afterImg: HTMLImageElement | null = null;
    if (afterImage) {
      afterImg = new Image();
      afterImg.src = afterImage;
      afterImg.onload = () => setLoaded((s) => ({ ...s, afterLoaded: true }));
      afterImg.onerror = () => setLoaded((s) => ({ ...s, afterLoaded: true }));
    }

    return () => {
      if (beforeImg) {
        beforeImg.onload = null;
        beforeImg.onerror = null;
        beforeImg = null;
      }
      if (afterImg) {
        afterImg.onload = null;
        afterImg.onerror = null;
        afterImg = null;
      }
    };
  }, [beforeImage, afterImage]);

  const bothLoaded = loaded.beforeLoaded && (afterImage ? loaded.afterLoaded : true);

  return (
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden", className)}>
      {!bothLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-foreground" />
            <div className="text-sm text-foreground">{t("comparisonSlider.preparing")}</div>
          </div>
        </div>
      )}

      {bothLoaded && (
        <ReactCompareSlider
          itemOne={<img src={beforeImage} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />}
          itemTwo={<img src={afterImage} alt="Background Removed" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      <div className="absolute bottom-0 left-4 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
        {beforeLabel}
      </div>
      <div className="absolute bottom-0 right-4 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
        {afterLabel}
      </div>
    </div>
  );
}