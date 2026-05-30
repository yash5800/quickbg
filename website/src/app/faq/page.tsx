import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — QuickBG',
  description:
    "Frequently asked questions about QuickBG's free AI background remover and image tools.",
  keywords: [
    'background remover',
    'free bg remover',
    'how to remove background',
    'bg blur',
    'background replace',
    'image editor',
    'QuickBG FAQ',
  ],
}

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: 'What is the best free background remover?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG offers a free AI background remover that preserves original resolution and does not require signup.",
      },
    },
    {
      "@type": "Question",
      name: 'How do I remove background from a video?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use QuickBG's video background remover tool or export frames to process images and reassemble as a video.",
      },
    },
    {
      "@type": "Question",
      name: 'How to blur background in Zoom?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use Zoom's built-in background blur or export your portrait from QuickBG and apply a soft blur in the editor before sharing.",
      },
    },
    {
      "@type": "Question",
      name: 'Does Canva have a background remover?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — Canva includes a Background Remover in its Effects panel; QuickBG is a free alternative that preserves full resolution.",
      },
    },
    {
      "@type": "Question",
      name: 'How to blur background in Photoshop?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use selection tools or Select Subject, create a layer mask, and apply a Gaussian Blur to the background layer.",
      },
    },
    {
      "@type": "Question",
      name: 'How do I get transparent PNG output?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG exports transparent PNGs automatically when you remove the background — choose PNG in the export options.",
      },
    }
  ],
}

export default function FAQPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />

      <h1 className="text-3xl font-semibold mb-4">Frequently Asked Questions</h1>

      <p className="text-lg text-muted-foreground mb-6">
        Answers to common questions about QuickBG's background remover and image tools.
      </p>

      <section className="space-y-6">
        <article>
          <h2 className="text-xl font-medium">What is the best free background remover?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            QuickBG provides a free AI-based background remover that keeps full resolution,
            processes unlimited images, and doesn't require signup for basic usage.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-medium">How do I remove background from a video?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For videos, export frames, process them with QuickBG, and reassemble the frames into
            a video. We also offer a dedicated video workflow for common use-cases.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-medium">How to blur background in Zoom?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use Zoom's blur feature or blur your portrait in QuickBG before sharing your camera
            feed.
          </p>
        </article>

        <article>
          <h2 className="text-xl font-medium">Does Canva have a background remover?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Yes — Canva has a Background Remover in Effects. If it doesn't meet your needs,
            try QuickBG for a free, high-resolution alternative.
          </p>
        </article>
      </section>
    </main>
  )
}
