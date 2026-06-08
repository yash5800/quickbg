"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

const NOTICE_COOKIE = "qb_cookie_notice";
const NOTICE_MAX_AGE = 60 * 60 * 24 * 365;

type NoticeState = "seen" | null;

function readNoticeCookie(): NoticeState {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${NOTICE_COOKIE}=`));

  if (!match) return null;

  const value = decodeURIComponent(match.split("=")[1] || "");
  return value === "seen" ? value : null;
}

function writeNoticeCookie() {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = [
    `${NOTICE_COOKIE}=seen`,
    `Max-Age=${NOTICE_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function CookieConsentBanner() {
  const [seen, setSeen] = useState<NoticeState>(null);
  const [mounted, setMounted] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    setSeen(readNoticeCookie());
    setMounted(true);
  }, []);

  const handleDismiss = () => {
    writeNoticeCookie();
    setSeen("seen");
  };

  if (!mounted || seen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-2xl"
      >
        <div className={cn("rounded-2xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur-xl")}>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Cookie className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("cookie.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("cookie.description")}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/privacy" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("footer.privacy")}
                </Link>

                <Button size="sm" onClick={handleDismiss} className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {t("cookie.accept")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
