import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "QuickBG - Unlimited Free AI Background Remover & Image Tools | Ultimate Free Tool",
  description:
    "Ultimate free unlimited background remover, image resizer, background replacer, blur tool, crop & adjust. 100% free, no limits, AI-powered. Remove background instantly, resize to 4K, replace backgrounds, blur effects, smart crop - all free forever!",
  keywords: [
    "background remover", "remove background", "free background remover", "unlimited background removal", "AI background removal",
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

import { ClientLayout } from "@/components/client-layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-sans`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
