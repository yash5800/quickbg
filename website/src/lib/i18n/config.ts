export const locales = [
  "en", "es", "fr", "de", "hi",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDisplayNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  hi: "हिन्दी",
};

export const localePrefixes: Record<Locale, string> = {
  en: "",
  es: "/es",
  fr: "/fr",
  de: "/de",
  hi: "/hi",
};

export const localeOpenGraph: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  hi: "hi_IN",
};

// Sort by length descending so "es-mx" is matched before "es"
const sortedNonDefault = [...locales]
  .filter((l) => l !== defaultLocale)
  .sort((a, b) => b.length - a.length);
const localePattern = sortedNonDefault.join("|");
const localeRegex = new RegExp(`^/(${localePattern})(/|$)`);

export function getLocaleFromPath(pathname: string): { locale: Locale; pathWithoutLocale: string } {
  const match = pathname.match(localeRegex);
  if (match) {
    const locale = match[1] as Locale;
    const rest = pathname.slice(match[1].length + 1) || "/";
    return { locale, pathWithoutLocale: rest.startsWith("/") ? rest : "/" + rest };
  }
  return { locale: defaultLocale, pathWithoutLocale: pathname };
}

export function getPathWithLocale(pathname: string, targetLocale: Locale, currentLocale: Locale): string {
  const { pathWithoutLocale } =
    currentLocale === defaultLocale
      ? { pathWithoutLocale: pathname }
      : getLocaleFromPath(pathname);

  const prefix = localePrefixes[targetLocale];
  const cleanPath = pathWithoutLocale === "/" ? "" : pathWithoutLocale;
  return `${prefix}${cleanPath}` || "/";
}

export function isLocalePath(pathname: string): boolean {
  return localeRegex.test(pathname);
}
