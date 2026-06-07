import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AppLayout } from "@/components/app-layout";
import { articles, type BlogArticle } from "../blog-data";
import { Marked } from "marked";
import { LocaleLink } from "@/components/locale-link";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";

const marked = new Marked({ gfm: true });

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};

  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;

  return getLocaleMetadata(locale, "blog", `/blog/${slug}`, {
    title: `${article.title} — QuickBG Blog`,
    description: article.excerpt,
  });
}

function localizeArticle(article: BlogArticle, t: (key: string) => string): BlogArticle {
  const lookup = (field: "title" | "excerpt" | "category" | "content"): string => {
    const key = `blog.articles.${article.slug}.${field}`;
    const val = t(key);
    return val !== key ? val : article[field];
  };
  return {
    ...article,
    title: lookup("title"),
    excerpt: lookup("excerpt"),
    category: lookup("category"),
    content: lookup("content"),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  const { t } = await getServerTranslations();

  if (!article) {
    notFound();
  }

  const localized = localizeArticle(article, t);
  const htmlContent = await marked.parse(localized.content);

  return (
    <AppLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <LocaleLink href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          {t("blog.back")}
        </LocaleLink>
        <header className="mb-8">
          <div className="text-sm text-muted-foreground mb-2">{article.date}</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{localized.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{localized.excerpt}</p>
        </header>
        <div
          className="prose prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>
    </AppLayout>
  );
}
