"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ImageProvider, useImages } from "@/contexts/ImageContext";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { GlobalDropZone } from "@/components/global-drop-zone";
import { Menu, X, Home, Sparkles, Zap, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { getQueueStatus, QueueStatus } from "@/lib/worker-api";

function FloatingCredits() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<string>("");
  const [isExhausted, setIsExhausted] = useState(false);
  const resetEndTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getQueueStatus();
        setQueueStatus(status);

        if (status.remaining === 0) {
          setIsExhausted(true);
          resetEndTimeRef.current = Date.now() + (status.reset_in_seconds ?? 3600) * 1000;
        } else {
          setIsExhausted(false);
        }
      } catch (err) {
        console.error("Failed to fetch queue status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isExhausted) {
      setDisplaySeconds("");
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((resetEndTimeRef.current - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setDisplaySeconds(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isExhausted]);

  const remaining = queueStatus?.remaining ?? 25;

  return (
    <div className="fixed top-20 right-3 z-40 md:right-6">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background/90 border shadow-md backdrop-blur-sm text-xs transition-colors",
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
        <span className={cn("font-semibold", remaining === 0 ? "text-destructive" : "")}>{remaining}</span>
        {isExhausted && displaySeconds && (
          <span className="font-semibold tabular-nums text-destructive animate-pulse">{displaySeconds}</span>
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
      <ImageProvider>
        <ToastProvider>
          <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 -z-10 gradient-mesh opacity-50" />
            {!isAdminArea && <Header />}
            <main className="pt-16">
              <GlobalDropZone>{children}</GlobalDropZone>
            </main>
            {!isAdminArea && <FloatingCredits />}
          </div>
        </ToastProvider>
      </ImageProvider>
    </ThemeProvider>
  );
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { images } = useImages();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tools", label: "Tools", icon: Package },
    { href: "/remover", label: images.length > 0 ? `Remover (${images.length})` : "Remover", icon: Sparkles },
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