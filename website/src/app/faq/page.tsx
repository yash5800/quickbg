import { AppLayout } from "@/components/app-layout";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "faq", "/faq");
}

export default async function FAQPage() {
  const { t } = await getServerTranslations();
  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("faq.heading")}</h1>
          <p className="mt-4 text-muted-foreground">{t("faq.subheading")}</p>
        </div>
        <div className="space-y-6">
          {faqIds.map((id) => (
            <div key={id} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <h2 className="text-lg font-semibold mb-2">{t(`faq.items.${id}.q`)}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`faq.items.${id}.a`)}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
