import type { Metadata } from "next"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import { articles, siteUrl, blogPath } from "./blog-data"

export const metadata: Metadata = {
  title: "Blog — QuickBG",
  description:
    "Learn about AI background removal, e-commerce product photography, image editing workflows, and tips for getting the best results with QuickBG.",
  openGraph: {
    title: "Blog — QuickBG",
    description:
      "Learn about AI background removal, e-commerce product photography, image editing workflows, and tips for getting the best results with QuickBG.",
    url: `${siteUrl}${blogPath}`,
    type: "website",
  },
}

const blogStructured = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "QuickBG Blog",
  description:
    "Articles about AI background removal, product photography, e-commerce listings, and image editing.",
  url: `${siteUrl}${blogPath}`,
  author: {
    "@type": "Organization",
    name: "QuickBG Team",
    url: siteUrl,
  },
}

export default function BlogIndexPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructured) }}
        />

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary/80">Blog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl lg:text-5xl">
            Guides, tutorials, and tips
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
            Learn how to get the most out of AI background removal, improve your product photos, and build an efficient
            image editing workflow — all for free.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`${blogPath}/${article.slug}`}
              className="premium-surface group relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>{article.category}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{article.date}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{article.readTime}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white group-hover:text-secondary transition-colors">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/50 line-clamp-3">
                {article.excerpt}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-secondary/80 group-hover:text-secondary transition-colors">
                Read article
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">Try QuickBG tools</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Put what you learn into practice. Remove backgrounds, resize images, adjust colors, and more — all free, no
            signup required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/remover"
              className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white px-4 text-sm font-semibold text-black transition hover:bg-secondary"
            >
              Background Remover
            </Link>
            <Link
              href="/tools"
              className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              All Tools
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
