import { AppLayout } from "@/components/app-layout";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";
import { FaqPageClient } from "@/components/faq-items";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "faq", "/faq");
}

export default async function FAQPage() {
  const { t } = await getServerTranslations();
  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19", "q20"] as const;

  const items = faqIds.map((id) => ({
    id,
    q: t(`faq.items.${id}.q`),
    a: t(`faq.items.${id}.a`),
  }));

  return (
    <AppLayout>
      <FaqPageClient
        heading={t("faq.heading")}
        subheading={t("faq.subheading")}
        items={items}
      />
    </AppLayout>
  );
}
