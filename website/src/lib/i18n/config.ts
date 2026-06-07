export const locales = ["en", "hi", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDisplayNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  de: "Deutsch",
};

export const localePrefixes: Record<Locale, string> = {
  en: "",
  hi: "/hi",
  de: "/de",
};

export const localeOpenGraph: Record<Locale, string> = {
  en: "en_US",
  hi: "hi_IN",
  de: "de_DE",
};

// Build regex patterns dynamically from the locales list
const nonDefaultLocales = locales.filter((l) => l !== defaultLocale);
const localePattern = nonDefaultLocales.join("|");
const localeRegex = new RegExp(`^/(${localePattern})(/|$)`);

export function getLocaleFromPath(pathname: string): { locale: Locale; pathWithoutLocale: string } {
  const match = pathname.match(localeRegex);
  if (match) {
    const locale = match[1] as Locale;
    const afterLocale = pathname.indexOf(locale) + locale.length;
    const rest = pathname.slice(afterLocale) || "/";
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
