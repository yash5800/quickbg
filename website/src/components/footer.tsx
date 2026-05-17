"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Image src="/icon.jpeg" alt="QuickBG" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold">QuickBG</span>
          </div>

          <p className="text-xs text-muted-foreground max-w-md">
            AI-powered background removal. Results may vary, please review before use.
          </p>

          {/* {donateUrl && (
            <Button
              size="sm"
              className="gap-2 text-xs h-8 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white border-0"
              onClick={() => window.open(donateUrl, "_blank")}
            >
              <Heart className="h-3.5 w-3.5" />
              Support Us
            </Button>
          )} */}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-border">•</span>
            <Link href="/legal" className="hover:text-foreground transition-colors">
              Copyright
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>© {currentYear} QuickBG</span>
            <span className="text-border">•</span>
            <span>Made with precision</span>
          </div>
        </div>
      </div>
    </footer>
  );
}