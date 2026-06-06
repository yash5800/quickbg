import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { articles, siteUrl, blogPath } from "../blog-data"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) return {}

  return {
    title: `${article.title} — QuickBG Blog`,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} — QuickBG Blog`,
      description: article.excerpt,
      url: `${siteUrl}${blogPath}/${slug}`,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
    },
  }
}

function renderContent(html: string) {
  return html
    .replace(/<a href="\/remover">/g, '<a href="/remover" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/replace-bg">/g, '<a href="/replace-bg" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/resize">/g, '<a href="/resize" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/crop">/g, '<a href="/crop" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/sharpness">/g, '<a href="/sharpness" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/adjust">/g, '<a href="/adjust" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/blur-bg">/g, '<a href="/blur-bg" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/converter">/g, '<a href="/converter" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/">/g, '<a href="/" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
    .replace(/<a href="\/tools">/g, '<a href="/tools" class="text-lime-300 underline underline-offset-2 hover:text-lime-200 transition-colors">')
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) notFound()

  const otherArticles = articles.filter((a) => a.slug !== slug).slice(0, 3)

  const articleStructured = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "QuickBG",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}${blogPath}/${slug}`,
    },
  }

  return (
    <AppLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructured) }}
        />

        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Back to blog
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>{article.category}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{article.date}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{article.readTime}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            {article.excerpt}
          </p>
        </header>

        <div className="mt-10 border-t border-white/10 pt-10">
          <div
            className="prose prose-invert prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-normal prose-p:text-white/60 prose-p:leading-7 prose-a:text-lime-300 prose-a:underline prose-a:underline-offset-2 prose-strong:text-white/80 prose-code:text-lime-200 prose-code:bg-white/[0.04] prose-code:px-1 prose-code:rounded prose-li:text-white/60 max-w-none space-y-5 text-sm sm:text-base"
            dangerouslySetInnerHTML={{
              __html: renderContent(article.content),
            }}
          />
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">Published {article.date} by {article.author}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${siteUrl}${blogPath}/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${siteUrl}${blogPath}/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {otherArticles.length > 0 && (
          <div className="mt-12 border-t border-white/10 pt-10">
            <h2 className="text-lg font-semibold text-white">More articles</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {otherArticles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="premium-surface rounded-[1.25rem] border border-white/10 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20"
                >
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>{a.category}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{a.readTime}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-white">{a.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50 line-clamp-2">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">Try QuickBG</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Remove backgrounds instantly, resize, crop, and adjust your images — all free, no signup required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/remover"
              className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white px-4 text-sm font-semibold text-black transition hover:bg-lime-200"
            >
              Open Background Remover
            </Link>
            <Link
              href="/blog"
              className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </article>
    </AppLayout>
  )
}
