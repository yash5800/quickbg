"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { locales, localeDisplayNames, type Locale } from "@/lib/i18n/config";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium",
          "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
        )}
        aria-label={t("language.label")}
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{localeDisplayNames[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border/60 bg-popover shadow-lg backdrop-blur-md z-50 py-1">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLocale(l as Locale);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                "hover:bg-accent/60",
                locale === l
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {localeDisplayNames[l as Locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
