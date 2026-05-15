"use client";

import * as React from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/70">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-white/90" />
            <div className="text-sm text-white/90">Preparing preview…</div>
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

      <div className="absolute bottom-0 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
        {beforeLabel}
      </div>
      <div className="absolute bottom-0 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
        {afterLabel}
      </div>
    </div>
  );
}