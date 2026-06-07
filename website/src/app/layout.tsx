import type { Metadata, Viewport } from "next";
import { ClientLayout } from "@/components/client-layout";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free AI Background Remover - Unlimited Images, 100% Original Quality",
    description: "quickbg.dev offers free AI background remover that preserves 100% of your image's original quality. Instantly detect and remove subjects, process unlimited images quickly, and get professional-quality cutouts with no signup required. Ideal for product photos, social posts, and bulk processing.",
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
  manifest: "/manifest.json",
  applicationName: "QuickBG",
  appleWebApp: {
    capable: true,
    title: "QuickBG",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Free AI Background Remover - Unlimited Images, 100% Original Quality",
      description: "quickbg.dev offers free AI background remover that preserves 100% of your image's original quality. Instantly detect and remove subjects, process unlimited images quickly, and get professional-quality cutouts with no signup required. Ideal for product photos, social posts, and bulk processing.",
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
      <body className="font-sans">
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
