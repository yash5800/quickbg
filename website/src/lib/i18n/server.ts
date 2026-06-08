import { headers } from "next/headers";
import { defaultLocale, type Locale, localePrefixes } from "@/lib/i18n/config";
import { t as translate } from "@/lib/i18n/translations";

export async function getServerTranslations() {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;

  return {
    t: (key: string) => translate(locale, key),
    locale,
    localePrefix: localePrefixes[locale],
  };
}
