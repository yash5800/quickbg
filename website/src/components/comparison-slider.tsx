"use client";

import * as React from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { cn } from "@/lib/utils";

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
  return (
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden", className)}>
      <ReactCompareSlider
        itemOne={<img src={beforeImage} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />}
        itemTwo={<img src={afterImage} alt="Background Removed" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />}
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute bottom-0 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
        {beforeLabel}
      </div>
      <div className="absolute bottom-0 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
        {afterLabel}
      </div>
    </div>
  );
}