import { AppLayout } from "@/components/app-layout";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "faq", "/faq");
}

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best free background remover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG offers a free AI background remover that preserves original resolution, requires no signup, and processes unlimited images. It uses BiRefNet for precise edge detection on portraits, products, pets, and complex subjects.",
      },
    },
    {
      "@type": "Question",
      name: "Is QuickBG really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — QuickBG is completely free to use. No credit card, no signup, no hidden limits. You can process up to 25 images per hour at no cost with full resolution and no watermark.",
      },
    },
    {
      "@type": "Question",
      name: "What image formats does QuickBG support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG supports all major image formats including PNG, JPEG, WebP, AVIF, GIF, BMP, and TIFF. You can also convert between formats using our free converter tool.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use QuickBG images for commercial purposes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All images processed through QuickBG are yours to use for any purpose — personal, commercial, or otherwise. We claim no rights over your content.",
      },
    },
    {
      "@type": "Question",
      name: "How does QuickBG protect my privacy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Images are processed in memory and automatically purged from our servers after delivery. We never store, train on, or share your uploads. No account or personal data is required.",
      },
    },
    {
      "@type": "Question",
      name: "What is BiRefNet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BiRefNet (Bilateral Reference Network) is a state-of-the-art AI model for image matting. It produces cleaner edges than older models like U²-Net or MODNet, especially around hair, fur, and complex shapes.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a limit to how many images I can process?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG allows up to 25 images per hour for free users. This limit resets every hour. There are no daily or monthly caps.",
      },
    },
    {
      "@type": "Question",
      name: "Does QuickBG work on mobile devices?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. QuickBG is fully responsive and works on all modern mobile browsers. You can also install it as a PWA for an app-like experience.",
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-4 text-muted-foreground">
            Answers to common questions about QuickBG&apos;s free AI background remover, image formats, privacy, commercial use, and more.
          </p>
        </div>
        <div className="space-y-6">
          {faq.mainEntity.map((item, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
