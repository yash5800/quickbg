import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import hi from "@/messages/hi.json";

const messages: Record<string, Record<string, unknown>> = {
  en, es, fr, de, hi,
};

export function loadTranslations(locale: string): Record<string, unknown> {
  return messages[locale] ?? messages.en;
}

export function t(locale: string, key: string): string {
  const keys = key.split(".");
  let value: unknown = messages[locale] ?? messages.en;
  for (const k of keys) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[k];
  }
  return typeof value === "string" ? value : key;
}
