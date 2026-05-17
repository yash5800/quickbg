"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { ImageProvider, useImages } from "@/contexts/ImageContext";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { GlobalDropZone } from "@/components/global-drop-zone";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { Menu, X, Info, Sparkles, Zap, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/store/credits";
import { useCreditsSync } from "@/store/useCreditsSync";

function FloatingCredits() {
  const remaining = useCreditsStore((state) => state.remaining);
  const resetAt = useCreditsStore((state) => state.resetAt);
  const creditsLeft = Number.isFinite(remaining) ? remaining : 0;
  const [liveResetInSeconds, setLiveResetInSeconds] = useState(() =>
    Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))
  );

  // Sync credits for the whole app from one mounted place.
  useCreditsSync();

  useEffect(() => {
    const update = () => {
      setLiveResetInSeconds(Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)));
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [resetAt]);

  const formatResetTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExhausted = remaining === 0;

  return (
    <div className="fixed top-20 right-3 z-40 md:right-6">
      <div
        className={cn(
          "flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 border shadow-md backdrop-blur-sm text-xs transition-colors",
          remaining === 0
            ? "border-destructive/60 bg-destructive/10"
            : remaining < 10
              ? "border-amber-500/50 bg-amber-500/10"
              : "border-border/60"
        )}
      >
        <Zap
          className={cn(
            "h-3.5 w-3.5",
            remaining === 0 ? "text-destructive" : remaining < 10 ? "text-amber-500" : "text-primary"
          )}
        />
        <span className={cn("font-semibold tabular-nums", remaining === 0 ? "text-destructive" : "")}>{creditsLeft}</span>
        {isExhausted && (
          <span className="font-semibold tabular-nums text-destructive animate-pulse">{formatResetTime(liveResetInSeconds)}</span>
        )}
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <QueryProvider>
        <ImageProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
              {!isAdminArea && <Header />}
              <main className="pt-16 flex-1">
                <GlobalDropZone>{children}</GlobalDropZone>
              </main>
              {!isAdminArea && <FloatingCredits />}
              {!isAdminArea && <Footer />}
              {!isAdminArea && <CookieConsentBanner />}
            </div>
          </ToastProvider>
        </ImageProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { images } = useImages();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Info },
    { href: "/tools", label: "Tools", icon: Package },
    { href: "/remover", label: images.length > 0 ? `Remover (${images.length})` : "Remover", icon: Sparkles },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon.jpeg" alt="QuickBG" width={36} height={36} className="rounded-md" />
              <span className="hidden sm:inline font-semibold">QuickBG</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn("gap-2 px-3.5", pathname === item.href && "text-primary bg-primary/10")}
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

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
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
