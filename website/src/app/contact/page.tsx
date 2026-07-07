import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";
import { FeedbackForm } from "@/components/feedback-section";
import { Card } from "@/components/ui/card";

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

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Product support</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Send bug reports, failed image examples, queue issues, and feature requests. Include the tool name and browser when possible.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Privacy requests</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ask questions about image deletion, data handling, AdSense cookies, or rights requests related to uploaded files.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Business inquiries</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Contact us about partnerships, API access, marketplace workflows, high-volume image processing, or commercial usage.
          </p>
        </Card>
      </section>

      <section className="mt-10 rounded-xl border border-border/70 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">What to include in your message</h2>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
          <p>
            For editing problems, tell us which tool you used, what file type you uploaded, what result you expected, and what went wrong.
            Screenshots or a short description of the image help us reproduce edge cases like hair, glass, shadows, or transparent objects.
          </p>
          <p>
            For account, policy, or privacy questions, include the page or feature involved and the country or region relevant to your
            request. We review messages manually and prioritize issues that affect image processing, privacy, accessibility, and site trust.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Response expectations</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            QuickBG is built as a lightweight image utility, so we focus support on issues that help users complete real editing work:
            upload failures, processing errors, confusing output, accessibility problems, and privacy questions. We do not ask for
            passwords, payment details, or private account credentials through this form.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Before sending sensitive files</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If your image contains confidential products, client material, documents, or personal information, describe the problem first.
            A cropped screenshot or a similar sample image is usually enough for troubleshooting. This keeps support useful while respecting
            the privacy-first workflow explained in our Privacy Policy.
          </p>
        </Card>
      </section>
    </div>
  );
}
