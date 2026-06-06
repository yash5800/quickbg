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

export function getLocaleFromPath(pathname: string): { locale: Locale; pathWithoutLocale: string } {
  const match = pathname.match(/^\/(de|hi)(\/|$)/);
  if (match) {
    const locale = match[1] as Locale;
    const rest = pathname.slice(match[0].length - 1) || "/";
    return { locale, pathWithoutLocale: rest.startsWith("/") ? rest : "/" + rest };
  }
  return { locale: "en" as Locale, pathWithoutLocale: pathname };
}

export function getPathWithLocale(pathname: string, targetLocale: Locale, currentLocale: Locale): string {
  const { pathWithoutLocale } =
    currentLocale === "en"
      ? { pathWithoutLocale: pathname }
      : getLocaleFromPath(pathname);

  const prefix = localePrefixes[targetLocale];
  const cleanPath = pathWithoutLocale === "/" ? "" : pathWithoutLocale;
  return `${prefix}${cleanPath}` || "/";
}

export function isLocalePath(pathname: string): boolean {
  return /^\/(de|hi)(\/|$)/.test(pathname);
}
