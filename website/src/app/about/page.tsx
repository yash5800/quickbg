import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About QuickBG - Technology and Workflow",
  description: "Learn how QuickBG removes backgrounds, what BiRefNet contributes, and how the workflow supports product, design, and social use cases.",
};

const faqItems = [
  {
    question: "What kind of images work best?",
    answer:
      "QuickBG works best on clear subjects with enough contrast from the background, especially portraits, products, pets, and flat-lay photos.",
  },
  {
    question: "Why does the site mention BiRefNet?",
    answer:
      "BiRefNet is the background-removal model family used in the processing pipeline, which helps QuickBG detect edges and subject boundaries quickly.",
  },
  {
    question: "What should I do if the edge looks rough?",
    answer:
      "Try a tighter crop, a cleaner source image, or one of the follow-up editing tools like blur, adjust, or replace background before exporting.",
  },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">About QuickBG</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl lg:text-5xl">
            Technology, workflow, and why the remover feels fast.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
            QuickBG is designed as a practical image utility: upload a file, remove the background, and
            keep moving into export or refinement. The site combines a focused toolchain with a lightweight
            explanation of the model and workflow so users understand what happens behind the scenes.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Card className="premium-surface p-6 space-y-4 text-sm text-white/60">
            <h2 className="text-lg font-semibold text-white">How the workflow works</h2>
            <p>
              The app accepts an image, runs the subject through the removal pipeline, and returns a transparent
              result that can be reused across product pages, banners, thumbnails, and social graphics.
            </p>
            <p>
              Once the cutout is ready, the rest of the tools stay close by. You can resize, crop, blur, replace
              the background, or adjust the image without leaving the product flow.
            </p>
          </Card>

          <Card className="premium-surface p-6 space-y-4 text-sm text-white/60">
            <h2 className="text-lg font-semibold text-white">Why BiRefNet matters</h2>
            <p>
              QuickBG references BiRefNet because strong foreground detection is essential for clean edges.
              The model helps identify subject boundaries so the output stays useful for product photography,
              profile images, and other real-world image tasks.
            </p>
            <p>
              That matters most when the source image includes hair, shadows, overlapping objects, or textured
              edges that need more than a simple color-keyed cutout.
            </p>
          </Card>
        </div>

        <Card className="premium-surface mt-4 p-6 space-y-5 text-sm text-white/60">
          <h2 className="text-lg font-semibold text-white">Common use cases</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">E-commerce</div>
              <p className="mt-2 leading-6">
                Clean product cutouts for listings, marketplaces, and promotional banners.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Design work</div>
              <p className="mt-2 leading-6">
                Transparent assets for posters, presentations, thumbnails, and layered compositions.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Social media</div>
              <p className="mt-2 leading-6">
                Fast cutouts for profile images, story graphics, reels covers, and content previews.
              </p>
            </div>
          </div>
        </Card>

        <Card className="premium-surface mt-4 p-6 space-y-5 text-sm text-white/60">
          <h2 className="text-lg font-semibold text-white">FAQ</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{item.question}</h3>
                <p className="mt-2 leading-6">{item.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="premium-surface mt-4 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-white/60">
          <div>
            <h2 className="text-lg font-semibold text-white">Need help or want to report an edge case?</h2>
            <p className="mt-2 leading-6">
              Reach out if you have questions about image handling, policy details, or a difficult file that
              needs manual review.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white px-5 text-sm font-semibold text-black transition hover:bg-lime-200"
          >
            Contact support
          </Link>
        </Card>
      </div>
    </AppLayout>
  );
}