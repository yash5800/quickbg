import * as React from "react";
import { cn } from "@/lib/utils";

export function Slider({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={cn("premium-slider w-full cursor-pointer touch-none", className)}
      {...props}
    />
  );
}
