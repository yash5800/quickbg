import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { LocaleLink } from "@/components/locale-link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";
import {
  Lightbulb,
  ArrowUpRight,
  Server,
  BrainCircuit,
  HeartHandshake,
  Cpu,
  Database,
  Shirt,
  GraduationCap,
  Stethoscope,
  Building2,
  ShoppingCart,
  Palette,
  Smartphone,
  Camera,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "about", "/about");
}

const useCasesIcons = {
  ecommerce: ShoppingCart,
  social: Smartphone,
  photo: Camera,
  design: Palette,
  fashion: Shirt,
  education: GraduationCap,
  health: Stethoscope,
  realestate: Building2,
};

export default async function AboutPage() {
  const { t } = await getServerTranslations();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Lightbulb className="h-4 w-4" />
            {t("about.badge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("about.heading")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("about.intro")}
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{t("about.techHeading")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t("about.techItems.model")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("about.techItems.modelDesc")}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Server className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t("about.techItems.serverless")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("about.techItems.serverlessDesc")}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t("about.techItems.fallback")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("about.techItems.fallbackDesc")}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t("about.techItems.queue")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("about.techItems.queueDesc")}</p>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{t("about.whoHeading")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(useCasesIcons).map(([key, Icon]) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/30 p-3">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="text-sm font-medium">{t(`about.useCases.${key}`)}</div>
                  <div className="text-xs text-muted-foreground">{t(`about.useCases.${key}Desc`)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{t("about.faqHeading")}</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-5">
                <h3 className="font-semibold mb-2">{t(`about.faqs.q${i}`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`about.faqs.a${i}`)}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{t("about.roadmapHeading")}</h2>
          <Card className="p-6">
            <div className="space-y-4">
              {["core", "suite", "lang", "api", "batch"].map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${["core", "suite"].includes(key) ? "bg-green-500" : ["lang"].includes(key) ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium text-sm">{t(`about.roadmap.${key}`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`about.roadmap.${key}Desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <HeartHandshake className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">{t("about.touchHeading")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("about.touchDesc")}</p>
            <LocaleLink
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("common.contactUs")}
              <ArrowUpRight className="h-4 w-4" />
            </LocaleLink>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
