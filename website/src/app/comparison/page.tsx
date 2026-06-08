import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Minus, HelpCircle } from "lucide-react";
import { LocaleLink } from "@/components/locale-link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "comparison", "/comparison");
}

const features = [
  {
    feature: "Price",
    quickbg: "Free — no credit card",
    removebg: "Free preview, paid HD",
    photoshop: "$23/mo subscription",
    canva: "Free with watermark, Pro $13/mo",
  },
  {
    feature: "Signup Required",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> No</>,
    removebg: <><Check className="inline h-4 w-4 text-secondary" /> Optional</>,
    photoshop: <><X className="inline h-4 w-4 text-red-400" /> Yes</>,
    canva: <><X className="inline h-4 w-4 text-red-400" /> Yes</>,
  },
  {
    feature: "Image Quality",
    quickbg: "Full resolution preserved",
    removebg: "HD on paid tier",
    photoshop: "Full control",
    canva: "Limited on free tier",
  },
  {
    feature: "Max Resolution",
    quickbg: "Original — no limit",
    removebg: "0.25 MP free, HD paid",
    photoshop: "Unlimited",
    canva: "Limited on free tier",
  },
  {
    feature: "Batch Processing",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    removebg: <><X className="inline h-4 w-4 text-red-400" /> No free</>,
    photoshop: <><Check className="inline h-4 w-4 text-secondary" /> Yes (actions)</>,
    canva: <><X className="inline h-4 w-4 text-red-400" /> No free</>,
  },
  {
    feature: "Watermark",
    quickbg: <><Minus className="inline h-4 w-4 text-secondary" /> None</>,
    removebg: <><X className="inline h-4 w-4 text-red-400" /> Free previews</>,
    photoshop: <><Minus className="inline h-4 w-4 text-secondary" /> None</>,
    canva: <><X className="inline h-4 w-4 text-red-400" /> Free exports</>,
  },
  {
    feature: "Background Replace",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    removebg: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    photoshop: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    canva: <><Check className="inline h-4 w-4 text-secondary" /> Yes (Pro)</>,
  },
  {
    feature: "Background Blur",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    removebg: <><X className="inline h-4 w-4 text-red-400" /> No</>,
    photoshop: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    canva: <><Check className="inline h-4 w-4 text-secondary" /> Yes (Pro)</>,
  },
  {
    feature: "Resize/Crop Tools",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    removebg: <><X className="inline h-4 w-4 text-red-400" /> No</>,
    photoshop: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    canva: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
  },
  {
    feature: "Processing Speed",
    quickbg: "Under 5 seconds",
    removebg: "5-10 seconds",
    photoshop: "Minutes (manual)",
    canva: "10-30 seconds",
  },
  {
    feature: "Privacy",
    quickbg: "Auto-deleted after use, no training",
    removebg: "Retained 48 hours",
    photoshop: "Local processing",
    canva: "Stored for AI training",
  },
  {
    feature: "Commercial Use",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> Yes, no attribution</>,
    removebg: <><HelpCircle className="inline h-4 w-4 text-secondary/80" /> Paid tier</>,
    photoshop: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
    canva: <><HelpCircle className="inline h-4 w-4 text-secondary/80" /> With license</>,
  },
  {
    feature: "Mobile Support",
    quickbg: <><Check className="inline h-4 w-4 text-secondary" /> Browser-based</>,
    removebg: <><Check className="inline h-4 w-4 text-secondary" /> App available</>,
    photoshop: <><Check className="inline h-4 w-4 text-secondary" /> Express app</>,
    canva: <><Check className="inline h-4 w-4 text-secondary" /> Yes</>,
  },
];

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does QuickBG compare to Remove.bg?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QuickBG is free with no credit card, offers full-resolution exports without watermarks, and includes blur, replace, resize, and crop tools. Remove.bg charges per image for HD downloads and watermarks free previews.",
      },
    },
    {
      "@type": "Question",
      name: "Is QuickBG better than Photoshop for background removal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For quick background removal, QuickBG is faster and requires no manual selection or subscription. Photoshop offers more control for complex composites but requires expertise and a $23/month subscription.",
      },
    },
    {
      "@type": "Question",
      name: "Can QuickBG replace Canva's background remover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — QuickBG offers free background removal at full resolution without a watermark or Pro subscription. Canva's background remover requires a Pro plan for high-resolution transparent PNG exports.",
      },
    },
  ],
};

export default async function ComparisonPage() {
  const { t } = await getServerTranslations();
  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("comparison.label")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl lg:text-5xl">
            {t("comparison.heading")}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
            {t("comparison.intro")}
          </p>
        </div>

        <Card className="premium-surface mt-10 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80 font-semibold w-44">Feature</TableHead>
                  <TableHead className="text-secondary font-semibold">QuickBG</TableHead>
                  <TableHead className="text-white/80 font-semibold">Remove.bg</TableHead>
                  <TableHead className="text-white/80 font-semibold">Adobe Photoshop</TableHead>
                  <TableHead className="text-white/80 font-semibold">Canva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((row) => (
                  <TableRow key={row.feature} className="border-white/10">
                    <TableCell className="font-medium text-white/90">{row.feature}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-white/70">{row.quickbg}</span>
                    </TableCell>
                    <TableCell className="text-sm text-white/50">{row.removebg}</TableCell>
                    <TableCell className="text-sm text-white/50">{row.photoshop}</TableCell>
                    <TableCell className="text-sm text-white/50">{row.canva}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-white">{t("comparison.detailedHeading")}</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            {t("comparison.detailedDesc")}
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="premium-surface p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10 text-sm font-bold text-secondary">Q</span>
                <h3 className="text-lg font-semibold text-white">QuickBG</h3>
              </div>
              <p className="text-sm leading-6 text-white/50">
                QuickBG is a free, browser-based background remover that uses BiRefNet AI to produce high-quality transparent PNGs.
                No signup, no watermark, no resolution limits. Includes additional tools for blur, replace, resize, crop, and image adjustment.
                Best for e-commerce sellers, social media managers, and designers who need fast cutouts without a subscription.
              </p>
              <LocaleLink
                href="/remover"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Try QuickBG
              </LocaleLink>
            </Card>

            <Card className="premium-surface p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300">R</span>
                <h3 className="text-lg font-semibold text-white">Remove.bg</h3>
              </div>
              <p className="text-sm leading-6 text-white/50">
                Remove.bg is a dedicated background removal service with a free preview (low resolution, watermarked) and
                paid HD downloads starting at $0.99/image or subscription plans. It offers an API for developers and
                integrations with Shopify, Figma, and more. The main drawback is cost at scale — processing hundreds of
                product photos adds up quickly.
              </p>
              <p className="text-sm leading-6 text-white/50">
                <span className="text-white/80">Verdict:</span> Good for one-off images, but expensive for bulk workflows compared to QuickBG.
              </p>
            </Card>

            <Card className="premium-surface p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-sm font-bold text-blue-300">Ps</span>
                <h3 className="text-lg font-semibold text-white">Adobe Photoshop</h3>
              </div>
              <p className="text-sm leading-6 text-white/50">
                Photoshop is the industry standard for image editing with complete control over every pixel. Its Select
                Subject, layer masks, and pen tool give professionals fine-grained control. However, it requires a $23/month
                subscription, a learning curve, and manual work for each image. Background removal that takes seconds in
                QuickBG can take 5-10 minutes in Photoshop.
              </p>
              <p className="text-sm leading-6 text-white/50">
                <span className="text-white/80">Verdict:</span> Best for complex composites and retouching, but overkill and slow for simple background removal.
              </p>
            </Card>

            <Card className="premium-surface p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-sm font-bold text-purple-300">C</span>
                <h3 className="text-lg font-semibold text-white">Canva</h3>
              </div>
              <p className="text-sm leading-6 text-white/50">
                Canva is a popular design platform that includes a Background Remover in its Effects panel. The tool works
                well for basic cutouts but requires a Canva Pro subscription ($13/month) for transparent PNG exports at
                full resolution. Free tier exports include a watermark. Canva also stores uploads for AI training, which
                raises privacy concerns for commercial work.
              </p>
              <p className="text-sm leading-6 text-white/50">
                <span className="text-white/80">Verdict:</span> Good if you already use Canva Pro, but QuickBG offers better privacy and free HD exports.
              </p>
            </Card>
          </div>
        </section>

        <section className="mt-16">
          <Card className="premium-surface overflow-hidden">
            <div className="bg-gradient-to-br from-lime-500/10 via-transparent to-transparent p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">{t("comparison.whyWinsLabel")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{t("comparison.whyWinsTitle")}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Check className="h-5 w-5 text-secondary" />
                  <h3 className="mt-3 text-sm font-semibold text-white">Truly Free, No Catch</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    Unlike Remove.bg and Canva Pro, QuickBG doesn&apos;t charge for HD exports or hide features behind a paywall.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Check className="h-5 w-5 text-secondary" />
                  <h3 className="mt-3 text-sm font-semibold text-white">Full Resolution Always</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    No compression, no resolution caps, no watermarks. What you upload is what you download at full quality.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Check className="h-5 w-5 text-secondary" />
                  <h3 className="mt-3 text-sm font-semibold text-white">Complete Toolchain</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    Blur, replace, resize, crop, adjust — eight tools in one place. No need to switch between apps.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Check className="h-5 w-5 text-secondary" />
                  <h3 className="mt-3 text-sm font-semibold text-white">No Signup Required</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    Start removing backgrounds immediately. No account creation, no email verification, no onboarding friction.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Check className="h-5 w-5 text-secondary" />
                  <h3 className="mt-3 text-sm font-semibold text-white">Privacy First</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    Images are auto-deleted after processing. We don&apos;t train on your uploads or share them with third parties.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Check className="h-5 w-5 text-secondary" />
                  <h3 className="mt-3 text-sm font-semibold text-white">AI-Powered Precision</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    BiRefNet model handles hair, fur, glass, and complex edges with the same accuracy as paid services.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <LocaleLink
                  href="/remover"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-secondary"
                >
                  {t("comparison.tryFree")}
                </LocaleLink>
                <LocaleLink
                  href="/faq"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  {t("comparison.viewFaq")}
                </LocaleLink>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
