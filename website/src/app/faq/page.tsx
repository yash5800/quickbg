import { AppLayout } from "@/components/app-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — QuickBG",
  description:
    "Answers to common questions about QuickBG's free AI background remover, image formats, privacy, commercial use, and more.",
  keywords: [
    "background remover",
    "free bg remover",
    "how to remove background",
    "bg blur",
    "background replace",
    "image editor",
    "QuickBG FAQ",
    "BiRefNet",
    "transparent PNG",
  ],
};

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
      name: "Does QuickBG preserve image quality?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. QuickBG exports transparent PNGs at full original resolution. There is no compression, no quality loss, and no watermark added to your images.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use QuickBG for commercial projects?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — all images processed through QuickBG can be used for commercial purposes, including Amazon listings, Etsy shops, marketing materials, and client work. No attribution needed.",
      },
    },
    {
      "@type": "Question",
      name: "How does AI background removal work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG uses BiRefNet, a deep learning model that detects foreground subjects by analyzing millions of image boundaries and edge patterns. It identifies the subject regardless of background complexity, hair detail, or overlapping objects.",
      },
    },
    {
      "@type": "Question",
      name: "What image formats are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG accepts PNG, JPG, WebP, HEIC, and AVIF uploads. All results are exported as high-quality transparent PNGs. Format conversion between these types is also supported.",
      },
    },
    {
      "@type": "Question",
      name: "How do I get transparent PNG output?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG exports transparent PNGs automatically when you remove the background. The output preserves full resolution with no white box or solid background behind the subject.",
      },
    },
    {
      "@type": "Question",
      name: "How to blur background in Zoom?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can use Zoom's built-in background blur feature, or export your portrait from QuickBG and use the blur background tool to apply adjustable soft blur before sharing your camera feed.",
      },
    },
    {
      "@type": "Question",
      name: "Does Canva have a background remover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — Canva includes a Background Remover in its Effects panel. However, it requires a Pro subscription for full-resolution exports. QuickBG is a free alternative that preserves full resolution without a paywall.",
      },
    },
    {
      "@type": "Question",
      name: "How to blur background in Photoshop?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In Photoshop, use selection tools or Select Subject, create a layer mask, and apply a Gaussian Blur to the background layer. QuickBG offers a faster alternative with one-click background blur and adjustable intensity.",
      },
    },
    {
      "@type": "Question",
      name: "What is BiRefNet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BiRefNet (Bilateral Reference Network) is a deep learning model family designed for high-precision background removal. It excels at detecting fine details like hair, fur, and translucent edges that traditional chroma-key or simpler AI models struggle with.",
      },
    },
    {
      "@type": "Question",
      name: "How many images can I process per hour?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free users can process up to 25 images per hour. Most images complete in under 5 seconds, making this suitable for bulk workflows, small product catalogs, and batch social media content.",
      },
    },
    {
      "@type": "Question",
      name: "Are my images private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. QuickBG processes images in memory and does not store them permanently. We do not use your uploads for AI training, share them with third parties, or retain them after processing completes.",
      },
    },
    {
      "@type": "Question",
      name: "How long are images stored?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Uploaded images are temporarily stored only for the duration of processing and are automatically deleted shortly after you leave or close the session. No permanent copies are kept.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if the AI fails?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If the AI fails to produce a clean cutout, you can use the erase and restore brush tools to manually refine the mask. For persistently difficult images, try a higher-contrast source photo or crop closer to the subject.",
      },
    },
    {
      "@type": "Question",
      name: "Can I batch process images?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — QuickBG supports batch uploads. You can drag and drop multiple images at once, and each one will be processed individually. Batch processing is ideal for product catalogs and bulk workflows.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a mobile app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG is a web-based tool that works on all modern browsers, including mobile browsers on iOS and Android. There is no native app required — simply visit the site to remove backgrounds from any device.",
      },
    },
    {
      "@type": "Question",
      name: "How does QuickBG compare to Remove.bg?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG is free with no credit card required, offers full-resolution transparent PNG exports without watermarks, and includes additional tools like blur, replace, resize, and crop. Remove.bg charges per image for high-resolution downloads and watermarks free previews.",
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">FAQ</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
            Answers to common questions about QuickBG&apos;s background remover, privacy, commercial use, and image tools.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faq.mainEntity.map((item) => (
            <article
              key={item.name}
              className="premium-surface rounded-2xl p-6 transition hover:border-white/20"
            >
              <h2 className="text-lg font-semibold text-white">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">{item.acceptedAnswer.text}</p>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
