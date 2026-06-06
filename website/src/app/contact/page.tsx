import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { FeedbackForm } from "@/components/feedback-section";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "contact", "/contact");
}

export default function ContactPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/80">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Send feedback, questions, or partnership requests
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          Use the form below to reach the QuickBG team directly. Messages go to the site owner, and we&apos;ll reply to the email you provide.
        </p>
      </div>

      <div className="mt-10">
        <FeedbackForm />
      </div>
    </div>
  );
}
