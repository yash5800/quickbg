"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONSENT_COOKIE = "qb_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

type ConsentState = "accepted" | "rejected" | null;

function readConsentCookie(): ConsentState {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE}=`));

  if (!match) return null;

  const value = decodeURIComponent(match.split("=")[1] || "");
  return value === "accepted" || value === "rejected" ? value : null;
}

function writeConsentCookie(value: "accepted" | "rejected") {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = [
    `${CONSENT_COOKIE}=${encodeURIComponent(value)}`,
    `Max-Age=${CONSENT_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(readConsentCookie());
    setMounted(true);
  }, []);

  const handleConsent = (value: "accepted" | "rejected") => {
    writeConsentCookie(value);
    setConsent(value);
  };

  if (!mounted || consent) {
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
        <div className={cn("rounded-2xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur-xl") }>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Cookie className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Cookies and privacy choices</p>
                <p className="text-sm text-muted-foreground">
                  We use essential cookies for sessions, credits, and queue tracking. Choose whether to allow non-essential cookies.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/privacy" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  View privacy policy
                </Link>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleConsent("rejected")} className="gap-2">
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleConsent("accepted")} className="gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Accept all
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}