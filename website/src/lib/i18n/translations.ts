import type { Locale } from "./config";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import de from "@/messages/de.json";

const messages: Record<Locale, Record<string, unknown>> = {
  en,
  hi,
  de,
};

export function loadTranslations(locale: Locale): Record<string, unknown> {
  return messages[locale] ?? messages.en;
}

export function t(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: unknown = messages[locale] ?? messages.en;
  for (const k of keys) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[k];
  }
  return typeof value === "string" ? value : key;
}
