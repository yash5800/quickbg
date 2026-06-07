"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { useLocale } from "@/contexts/LocaleContext";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLocale();

  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/icon.jpeg" alt="" width={28} height={28} className="rounded-md" />
              <span className="text-sm font-semibold">QuickBG</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-44">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.tools")}</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><LocaleLink href="/remover" className="hover:text-foreground transition-colors">{t("footer.remover")}</LocaleLink></li>
              <li><LocaleLink href="/replace-bg" className="hover:text-foreground transition-colors">{t("footer.replaceBg")}</LocaleLink></li>
              <li><LocaleLink href="/blur-bg" className="hover:text-foreground transition-colors">{t("footer.blurBg")}</LocaleLink></li>
              <li><LocaleLink href="/resize" className="hover:text-foreground transition-colors">{t("footer.resize")}</LocaleLink></li>
              <li><LocaleLink href="/crop" className="hover:text-foreground transition-colors">{t("footer.crop")}</LocaleLink></li>
              <li><LocaleLink href="/adjust" className="hover:text-foreground transition-colors">{t("footer.adjust")}</LocaleLink></li>
              <li><LocaleLink href="/sharpness" className="hover:text-foreground transition-colors">{t("footer.sharpness")}</LocaleLink></li>
              <li><LocaleLink href="/converter" className="hover:text-foreground transition-colors">{t("footer.converter")}</LocaleLink></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.resources")}</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><LocaleLink href="/blog" className="hover:text-foreground transition-colors">{t("footer.blog")}</LocaleLink></li>
              <li><LocaleLink href="/faq" className="hover:text-foreground transition-colors">{t("footer.faq")}</LocaleLink></li>
              <li><LocaleLink href="/comparison" className="hover:text-foreground transition-colors">{t("footer.comparison")}</LocaleLink></li>
              <li><LocaleLink href="/about" className="hover:text-foreground transition-colors">{t("footer.about")}</LocaleLink></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.legal")}</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><LocaleLink href="/privacy" className="hover:text-foreground transition-colors">{t("footer.privacy")}</LocaleLink></li>
              <li><LocaleLink href="/terms" className="hover:text-foreground transition-colors">{t("footer.terms")}</LocaleLink></li>
              <li><LocaleLink href="/legal" className="hover:text-foreground transition-colors">{t("footer.copyright")}</LocaleLink></li>
              <li><LocaleLink href="/contact" className="hover:text-foreground transition-colors">{t("footer.contact")}</LocaleLink></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
          &copy; {currentYear} QuickBG. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
