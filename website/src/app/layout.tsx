import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { ClientLayout } from "@/components/client-layout";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "QuickBG - Unlimited Free AI Background Remover & Image Tools | Ultimate Free Tool",
  description:
    "Ultimate free unlimited background remover, image resizer, background replacer, blur tool, crop & adjust. 100% free, no limits, AI-powered. Remove background instantly, resize to 4K, replace backgrounds, blur effects, smart crop - all free forever!",
  keywords: [
    "background remover", "remove background", "free background remover", "free bg remover", "unlimited background removal", "unlimited free bg remover", "AI background removal",
    "transparent background", "image background remover", "product photo background removal", "free background eraser",
    "image resizer", "resize image", "AI upscale", "image enlarger", "photo resize", "free image resizer",
    "background replacer", "change background", "replace background", "solid background", "gradient background", "free background changer",
    "blur background", "background blur", "blur effect", "free blur tool", "gaussian blur",
    "smart crop", "crop image", "image cropper", "aspect ratio crop", "social media crop", "free crop tool",
    "adjust image", "image editor", "brightness contrast", "photo adjustment", "free image editor",
    "BiRefNet", "free unlimited tools", "ultimate free tool", "no limit background remover"
  ],
  authors: [{ name: "QuickBG Team" }],
  robots: "index, follow",
  openGraph: {
    title: "QuickBG - Unlimited Free AI Background Remover & All Image Tools",
    description: "100% FREE unlimited background remover, resizer, replacer, blur, crop & adjust. No limits, no signup required. Remove backgrounds in seconds!",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8295197664969828"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="android-chrome" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="android-chrome" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
        <link rel="icon" href="/favicon.ico" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "QuickBG",
          "url": "https://quickbg.dev",
          "description": "Free unlimited background remover and suite of image tools: blur, replace, resize, crop, and adjust.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://quickbg.dev/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "about": [
            { "@type": "Service", "name": "Background Remover" },
            { "@type": "Service", "name": "Background Blur" },
            { "@type": "Service", "name": "Background Replace" },
            { "@type": "Service", "name": "Smart Resize" },
            { "@type": "Service", "name": "Smart Crop" },
            { "@type": "Service", "name": "Image Adjust (brightness, contrast, saturation)" }
          ]
        }) }} />
      </head>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-sans`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}