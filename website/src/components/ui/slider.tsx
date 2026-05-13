import * as React from "react";
import { cn } from "@/lib/utils";

export function Slider({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={cn("w-full accent-primary", className)}
      {...props}
    />
  );
}
