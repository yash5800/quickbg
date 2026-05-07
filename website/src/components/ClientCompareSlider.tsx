"use client";

import dynamic from "next/dynamic";
import React from "react";

const ReactCompareSlider = dynamic(
  () => import("react-compare-slider").then((mod) => mod.ReactCompareSlider),
  { ssr: false }
);
const ReactCompareSliderImage = dynamic(
  () => import("react-compare-slider").then((mod) => mod.ReactCompareSliderImage),
  { ssr: false }
);
const ReactCompareSliderHandle = dynamic(
  () => import("react-compare-slider").then((mod) => mod.ReactCompareSliderHandle),
  { ssr: false }
);

export const ClientCompareSlider: React.FC<{
  beforeSrc: string;
  afterSrc: string;
  position: number;
  onPositionChange?: (position: number) => void;
  className?: string;
}> = ({ beforeSrc, afterSrc, position, onPositionChange, className }) => {
  return (
    <ReactCompareSlider
      defaultPosition={position}
      onPositionChange={onPositionChange}
      className={className}
      itemOne={<ReactCompareSliderImage src={beforeSrc} alt="Before" />}
      itemTwo={<ReactCompareSliderImage src={afterSrc} alt="After" />}
      handle={<ReactCompareSliderHandle />}
    />
  );
};

export const CompareSliderWithCustomHandle: React.FC<{
  beforeSrc: string;
  beforeAlt: string;
  afterSrc: string;
  afterAlt: string;
  position: number;
  onPositionChange?: (position: number) => void;
  className?: string;
}> = ({ beforeSrc, beforeAlt, afterSrc, afterAlt, position, onPositionChange, className }) => {
  return (
    <ReactCompareSlider
      onPositionChange={onPositionChange}
      defaultPosition={position}
      className={className}
      itemOne={
        <ReactCompareSliderImage
          src={beforeSrc}
          alt={beforeAlt}
          style={{ objectFit: "contain" }}
        />
      }
      itemTwo={
        <ReactCompareSliderImage
          src={afterSrc}
          alt={afterAlt}
          style={{ objectFit: "contain" }}
        />
      }
      handle={
        <ReactCompareSliderHandle
          buttonStyle={{
            width: 38,
            height: 38,
            borderRadius: 9999,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background) / 0.95)",
            color: "hsl(var(--primary))",
          }}
          linesStyle={{
            color: "hsl(var(--primary))",
            width: 2,
          }}
        />
      }
    />
  );
};
