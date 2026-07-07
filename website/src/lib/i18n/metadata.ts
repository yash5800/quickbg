import type { Metadata } from "next";
import { headers } from "next/headers";
import { defaultLocale, localeOpenGraph, type Locale } from "./config";
import { t } from "./translations";

const SITE_URL = "https://quickbg.dev";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * Generate locale-aware metadata for a page.
 * Reads the x-locale header set by middleware and returns metadata
 * with hreflang alternates for all supported locales.
 */
export async function generatePageMetadata(
  key: string,
  overrides?: Partial<PageMetadata>
): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;

  const title = overrides?.title || t(locale, `${key}.title`);
  const description = overrides?.description || t(locale, `${key}.description`);
  const keywords = overrides?.keywords;

  const isDefaultLocale = locale === defaultLocale;
  const alternates = {
    canonical: SITE_URL,
  };

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    robots: isDefaultLocale ? "index, follow" : "noindex, follow",
    alternates,
    openGraph: {
      title,
      description,
      url: SITE_URL,
      locale: localeOpenGraph[locale] || "en_US",
    },
  };
}

/**
 * Generate metadata for a specific locale (used in generateMetadata for sub-pages).
 */
export function getLocaleMetadata(
  locale: Locale,
  key: string,
  path: string,
  overrides?: Partial<PageMetadata>
): Metadata {
  const title = overrides?.title || t(locale, `${key}.title`);
  const description = overrides?.description || t(locale, `${key}.description`);
  const keywords = overrides?.keywords;

  const fullPath = path === "/" ? "" : path;
  const url = `${SITE_URL}${fullPath}`;
  const isDefaultLocale = locale === defaultLocale;

  const alternates = {
    canonical: url,
  };

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    robots: isDefaultLocale ? "index, follow" : "noindex, follow",
    alternates,
    openGraph: {
      title,
      description,
      url,
      locale: localeOpenGraph[locale] || "en_US",
    },
  };
}
