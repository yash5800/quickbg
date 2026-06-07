export const locales = [
  "en", "hi", "de",
  "fr", "es", "es-mx", "ar",
  "zh-cn", "zh-tw", "ja", "ko", "vi",
  "it", "pt-br", "pl", "cs", "hu", "ro",
  "ru", "tr",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDisplayNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  "es-mx": "Español (MX)",
  ar: "العربية",
  "zh-cn": "简体中文",
  "zh-tw": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  vi: "Tiếng Việt",
  it: "Italiano",
  "pt-br": "Português (BR)",
  pl: "Polski",
  cs: "Čeština",
  hu: "Magyar",
  ro: "Română",
  ru: "Русский",
  tr: "Türkçe",
};

export const localePrefixes: Record<Locale, string> = {
  en: "",
  hi: "/hi",
  de: "/de",
  fr: "/fr",
  es: "/es",
  "es-mx": "/es-mx",
  ar: "/ar",
  "zh-cn": "/zh-cn",
  "zh-tw": "/zh-tw",
  ja: "/ja",
  ko: "/ko",
  vi: "/vi",
  it: "/it",
  "pt-br": "/pt-br",
  pl: "/pl",
  cs: "/cs",
  hu: "/hu",
  ro: "/ro",
  ru: "/ru",
  tr: "/tr",
};

export const localeOpenGraph: Record<Locale, string> = {
  en: "en_US",
  hi: "hi_IN",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  "es-mx": "es_MX",
  ar: "ar_SA",
  "zh-cn": "zh_CN",
  "zh-tw": "zh_TW",
  ja: "ja_JP",
  ko: "ko_KR",
  vi: "vi_VN",
  it: "it_IT",
  "pt-br": "pt_BR",
  pl: "pl_PL",
  cs: "cs_CZ",
  hu: "hu_HU",
  ro: "ro_RO",
  ru: "ru_RU",
  tr: "tr_TR",
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
