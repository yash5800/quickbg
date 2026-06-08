"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Locale } from "@/lib/i18n/config";
import { locales, defaultLocale, localePrefixes, getLocaleFromPath } from "@/lib/i18n/config";
import { t as translate } from "@/lib/i18n/translations";
import { usePathname } from "next/navigation";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const { locale } = getLocaleFromPath(window.location.pathname);
  if ((locales as readonly string[]).includes(locale)) return locale;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  if (match) {
    const val = match[1] as Locale;
    if ((locales as readonly string[]).includes(val)) return val;
  }
  return defaultLocale;
}

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);

  useEffect(() => {
    const detected = detectLocale();
    if (detected !== locale) {
      setLocaleState(detected);
    }
  }, [pathname]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      const prefix = localePrefixes[newLocale];
      const current = localePrefixes[locale];
      let newPath: string;

      if (current) {
        newPath = pathname.replace(current, prefix || "");
      } else if (prefix) {
        newPath = `${prefix}${pathname === "/" ? "" : pathname}`;
      } else {
        newPath = pathname;
      }

      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;samesite=lax`;
      // Use full navigation so middleware rewrites work for locale-prefixed paths
      window.location.href = newPath || "/";
    },
    [pathname, locale]
  );

  const tFn = useCallback(
    (key: string) => translate(locale, key),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return { locale: defaultLocale, setLocale: () => {}, t: (key: string) => key };
  }
  return ctx;
}
