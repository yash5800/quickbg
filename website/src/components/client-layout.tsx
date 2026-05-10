"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ImageProvider, useImages } from "@/contexts/ImageContext";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { GlobalDropZone } from "@/components/global-drop-zone";
import { Menu, X, Home, Sparkles, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getQueueStatus, QueueStatus } from "@/lib/worker-api";

function FloatingCredits() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getQueueStatus();
        setQueueStatus(status);
      } catch (err) {
        console.error("Failed to fetch queue status:", err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const remaining = queueStatus?.remaining ?? 25;
  const resetSeconds = queueStatus?.reset_in_seconds ?? 3600;

  const formatResetTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed top-17 right-3 z-40 md:top-20 md:right-6">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background/90 border border-border/60 shadow-md backdrop-blur-sm text-xs">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold">{remaining}</span>
        {remaining < 10 && (
          <span className={`${remaining === 0 ? "text-destructive" : "text-amber-500"}`}>
            {formatResetTime(resetSeconds)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <ImageProvider>
        <ToastProvider>
          <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 -z-10 gradient-mesh opacity-50" />
            <Header />
            <main className="pt-16">
              <GlobalDropZone>{children}</GlobalDropZone>
            </main>
          </div>
        </ToastProvider>
      </ImageProvider>
    </ThemeProvider>
  );
}

function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { images } = useImages();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/editor", label: images.length > 0 ? `Editor (${images.length})` : "Editor", icon: Sparkles },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">QuickBG</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "gap-2 px-3.5",
                  pathname === item.href && "text-primary bg-primary/10"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
            <div className="ml-2 pl-2 border-l border-border/60">
              <ThemeToggle />
            </div>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <FloatingCredits />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 border-l border-border bg-background p-5 shadow-xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}