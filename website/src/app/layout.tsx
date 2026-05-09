import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "QuickBG - Professional AI Background Removal",
  description:
    "Remove image backgrounds instantly with our advanced AI technology. High-quality, fast, and free background removal for e-commerce, design, and marketing professionals.",
  keywords: ["background remover", "AI background removal", "image processing", "transparent background", "product photography", "BiRefNet"],
  authors: [{ name: "QuickBG Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
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