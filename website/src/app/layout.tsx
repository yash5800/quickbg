import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ClientLayout } from "@/components/client-layout";
import { Analytics } from "@vercel/analytics/react";
import { defaultLocale, localePrefixes, locales, localeOpenGraph, type Locale } from "@/lib/i18n/config";
import "./globals.css";

const baseKeywords = [
  "background remover", "remove background", "free background remover", "free bg remover", "free bg remover online", "free bg remover video", "free bg remover hd", "free bg remover app", "free bg remover ai", "adobe free bg remover", "online free bg remover", "free bg remover high quality", "best free bg remover", "free bg remover no sign up", "best free bg remover reddit", "free bg remover for video", "ai free bg remover", "hd free bg remover", "free bg remover reddit", "free bg remover without losing quality", "canva free bg remover", "free bg remover from video", "free bg remover adobe",
  "background remover", "background remover online", "background remover free", "image background remover", "adobe background remover", "ai background remover", "photo background remover", "video background remover", "adobe express background remover", "white background remover", "gif background remover", "png background remover", "background remover online free", "background remover png", "background remover canva", "pixlr background remover", "transparent background remover", "picture background remover",
  "bg blur", "bg blur online", "bg blur css", "bg blur free", "bg blur effect", "css bg blur", "zoom bg blur", "online bg blur free", "image bg blur", "bg blur image", "bg blur app", "bg blur not working framer", "photo bg blur", "google meet bg blur", "make bg blur", "pixelcut bg blur", "bg blur images", "tailwind bg blur", "bg blur tailwind",
  "what is the best free gif background remover?", "what is the best background remover for free?", "what is the best background remover for gifs?", "what is the most accurate background remover", "what is the best background remover", "canva background remover how to use", "how to use background remover in canva", "what is best free background remover reddit 2024", "where is the background remover in canva", "what is the best background remover app", "how to use canva background remover", "does canva have a background remover", "why is background remover not working on canva",
  "how to blur bg in zoom", "how to blur bg in photoshop", "how to blur bg in canva", "how to blur bg in iphone", "how to blur bg on zoom", "how to blur bg in capcut", "how to blur bg in picsart", "how to blur bg", "how to blur bg image in css", "how to blur bg in google meet", "how to make bg blur in css", "what is bg blur", "how do i blur people in the bg of my photo",
  "transparent background", "image background remover", "product photo background removal", "free background eraser",
  "image resizer", "resize image", "AI upscale", "image enlarger", "photo resize", "free image resizer",
  "background replacer", "change background", "replace background", "solid background", "gradient background", "free background changer",
  "blur background", "background blur", "blur effect", "free blur tool", "gaussian blur",
  "smart crop", "crop image", "image cropper", "aspect ratio crop", "social media crop", "free crop tool",
  "adjust image", "image editor", "brightness contrast", "photo adjustment", "free image editor",
  "BiRefNet", "free unlimited tools", "ultimate free tool", "no limit background remover"
];

const SITE_URL = "https://quickbg.dev";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;

  const title = "Free AI Background Remover - Unlimited Images, 100% Original Quality";
  const description = "quickbg.dev offers free AI background remover that preserves 100% of your image's original quality. Instantly detect and remove subjects, process unlimited images quickly, and get professional-quality cutouts with no signup required. Ideal for product photos, social posts, and bulk processing.";

  const prefix = localePrefixes[locale];
  const canonical = prefix ? `${SITE_URL}${prefix}` : SITE_URL;

  const alternates = {
    canonical,
    languages: {} as Record<string, string>,
  };

  for (const loc of locales) {
    if (loc === locale) continue;
    const locPrefix = localePrefixes[loc];
    alternates.languages[loc] = locPrefix ? `${SITE_URL}${locPrefix}` : SITE_URL;
  }

  return {
    title,
    description,
    keywords: baseKeywords,
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
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: localeOpenGraph[locale] || "en_US",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const localeHeader = headersList.get("x-locale") || defaultLocale;
  const lang = localeHeader === "en" ? "en" : localeHeader;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8295197664969828"
          crossOrigin="anonymous"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "QuickBG",
          url: "https://quickbg.dev",
          description: "Free unlimited background remover and suite of image tools: blur, replace, resize, crop, and adjust.",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://quickbg.dev/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          about: [
            { "@type": "Service", name: "Background Remover" },
            { "@type": "Service", name: "Background Blur" },
            { "@type": "Service", name: "Background Replace" },
            { "@type": "Service", name: "Smart Resize" },
            { "@type": "Service", name: "Smart Crop" },
            { "@type": "Service", name: "Image Adjust (brightness, contrast, saturation)" }
          ]
        }) }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ClientLayout initialLocale={localeHeader as Locale}>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
