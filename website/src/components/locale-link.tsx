"use client";

import React from "react";
import { default as NextLink } from "next/link";
import type { LinkProps as NextLinkProps } from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { localePrefixes, defaultLocale } from "@/lib/i18n/config";

type LocaleLinkProps = React.PropsWithChildren<
  NextLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>
>;

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const { locale } = useLocale();

  const adjustedHref = React.useMemo(() => {
    if (typeof href === "string") {
      const prefix = localePrefixes[locale];
      if (locale !== defaultLocale && href.startsWith("/")) {
        return `${prefix}${href === "/" ? "" : href}`;
      }
      return href;
    }
    return href;
  }, [href, locale]);

  // For locale-prefixed paths, use <a> so navigation goes through middleware
  if (
    typeof adjustedHref === "string" &&
    adjustedHref.startsWith("/") &&
    locale !== defaultLocale
  ) {
    const { ...anchorProps } = props as Record<string, unknown>;
    return (
      <a href={adjustedHref} {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={adjustedHref} {...props}>
      {children}
    </NextLink>
  );
}
