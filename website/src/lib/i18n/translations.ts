import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import de from "@/messages/de.json";
import fr from "@/messages/fr.json";
import es from "@/messages/es.json";
import esMX from "@/messages/es-mx.json";
import ar from "@/messages/ar.json";
import zhCN from "@/messages/zh-cn.json";
import zhTW from "@/messages/zh-tw.json";
import ja from "@/messages/ja.json";
import ko from "@/messages/ko.json";
import vi from "@/messages/vi.json";
import it from "@/messages/it.json";
import ptBR from "@/messages/pt-br.json";
import pl from "@/messages/pl.json";
import cs from "@/messages/cs.json";
import hu from "@/messages/hu.json";
import ro from "@/messages/ro.json";
import ru from "@/messages/ru.json";
import tr from "@/messages/tr.json";

const messages: Record<string, Record<string, unknown>> = {
  en, hi, de,
  fr, es, "es-mx": esMX, ar,
  "zh-cn": zhCN, "zh-tw": zhTW, ja, ko, vi,
  it, "pt-br": ptBR, pl, cs, hu, ro,
  ru, tr,
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
