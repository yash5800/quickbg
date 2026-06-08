import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";
import { FeedbackForm } from "@/components/feedback-section";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "contact", "/contact");
}

export default async function ContactPage() {
  const { t } = await getServerTranslations();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/80">{t("contact.label")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("contact.heading")}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          {t("contact.intro")}
        </p>
      </div>

      <div className="mt-10">
        <FeedbackForm />
      </div>
    </div>
  );
}
