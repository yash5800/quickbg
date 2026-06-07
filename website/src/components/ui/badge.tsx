import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border bg-transparent text-foreground",
  success: "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
