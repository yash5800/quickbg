import type { Metadata } from "next";
import { headers } from "next/headers";
import { locales, defaultLocale, localePrefixes, localeOpenGraph, type Locale } from "./config";
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

  // Build alternates for all locales
  const alternates = {
    canonical: locale === defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
    languages: {} as Record<string, string>,
  };

  for (const loc of locales) {
    if (loc === locale) continue;
    const prefix = localePrefixes[loc];
    alternates.languages[loc] = prefix ? `${SITE_URL}${prefix}` : SITE_URL;
  }

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates,
    openGraph: {
      title,
      description,
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

  const prefix = localePrefixes[locale];
  const fullPath = path === "/" ? "" : path;
  const url = prefix ? `${SITE_URL}${prefix}${fullPath}` : `${SITE_URL}${fullPath}`;

  // Build alternates for all locales
  const alternates = {
    canonical: url,
    languages: {} as Record<string, string>,
  };

  for (const loc of locales) {
    if (loc === locale) continue;
    const locPrefix = localePrefixes[loc];
    alternates.languages[loc] = locPrefix
      ? `${SITE_URL}${locPrefix}${fullPath}`
      : `${SITE_URL}${fullPath}`;
  }

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates,
    openGraph: {
      title,
      description,
      url,
      locale: localeOpenGraph[locale] || "en_US",
    },
  };
}
