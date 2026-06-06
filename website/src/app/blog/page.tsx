import type { Metadata } from "next";
import { headers } from "next/headers";
import { LocaleLink } from "@/components/locale-link";
import { AppLayout } from "@/components/app-layout";
import { articles, siteUrl, blogPath } from "./blog-data";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/contexts/LocaleContext";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "blog", "/blog");
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
};

function BlogContent() {
  const { t } = useLocale();

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructured) }}
        />
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("blog.heading")}</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {t("blog.subheading")}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <LocaleLink
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group block rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="text-xs text-muted-foreground mb-2">{article.date}</div>
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                {t("blog.readArticle")} <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </LocaleLink>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default function BlogIndexPage() {
  return <BlogContent />;
}
