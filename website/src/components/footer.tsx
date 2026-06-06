"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/icon.jpeg" alt="QuickBG" width={28} height={28} className="rounded-md" />
              <span className="text-sm font-semibold">QuickBG</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-44">
              AI-powered background removal for everyone. Fast, free, and private.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Tools</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/remover" className="hover:text-foreground transition-colors">Remover</Link></li>
              <li><Link href="/replace-bg" className="hover:text-foreground transition-colors">Replace BG</Link></li>
              <li><Link href="/blur-bg" className="hover:text-foreground transition-colors">Blur BG</Link></li>
              <li><Link href="/resize" className="hover:text-foreground transition-colors">Resize</Link></li>
              <li><Link href="/crop" className="hover:text-foreground transition-colors">Crop</Link></li>
              <li><Link href="/adjust" className="hover:text-foreground transition-colors">Adjust</Link></li>
              <li><Link href="/sharpness" className="hover:text-foreground transition-colors">Sharpness</Link></li>
              <li><Link href="/converter" className="hover:text-foreground transition-colors">Converter</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Resources</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link href="/comparison" className="hover:text-foreground transition-colors">Comparison</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Legal</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/legal" className="hover:text-foreground transition-colors">Copyright</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
          &copy; {currentYear} QuickBG. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
