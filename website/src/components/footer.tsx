"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Image src="/icon.jpeg" alt="QuickBG" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold">QuickBG</span>
          </div>

          <p className="text-xs text-muted-foreground max-w-md">
            AI-powered background removal. Results may vary, please review before use.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-border">•</span>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span className="text-border">•</span>
            <Link href="/legal" className="hover:text-foreground transition-colors">
              Copyright
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>© {currentYear} QuickBG</span>
            <span className="text-border">•</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}