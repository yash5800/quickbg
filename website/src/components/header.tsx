"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sparkles, Clock, Zap } from "lucide-react";
import { getQueueStatus, QueueStatus } from "@/lib/worker-api";

export function Header() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [resetSeconds, setResetSeconds] = useState(3600);
  const pathname = usePathname();
  const isRemoverPage = pathname === "/remover";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getQueueStatus();
        setQueueStatus(status);
        setResetSeconds(status.reset_in_seconds ?? 3600);
      } catch (err) {
        console.error("Failed to fetch queue status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live countdown for reset timer
  useEffect(() => {
    const interval = setInterval(() => {
      setResetSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = queueStatus?.remaining ?? 25;

  const formatResetTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline">QuickBG</span>
          </Link>

          {!isRemoverPage && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">{remaining}</span>
                <span className="text-muted-foreground">uploads left</span>
                {remaining === 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive ml-1">
                    <Clock className="h-3 w-3" />
                    {formatResetTime(resetSeconds)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {!isRemoverPage && (
          <div className="md:hidden pb-3 -mt-1">
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">{remaining}</span>
              <span className="text-muted-foreground">uploads left</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
