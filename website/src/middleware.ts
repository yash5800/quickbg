import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSessionToken } from "@/lib/admin-auth";
import { getLocaleFromPath, defaultLocale } from "@/lib/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth handling (runs before static skip so auth stays protected)
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLogin = pathname === "/admin/login";
  if (isAdminPath) {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const isAuthenticated = sessionToken === getAdminSessionToken();

    if (!isAuthenticated && !isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (isAuthenticated && isAdminLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // Skip static files, API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/workbox-")
  ) {
    return NextResponse.next();
  }

  // Locale handling for all other paths
  const { locale, pathWithoutLocale } = getLocaleFromPath(pathname);
  const response =
    locale !== defaultLocale
      ? NextResponse.rewrite(new URL(pathWithoutLocale, request.url))
      : NextResponse.next();

  response.headers.set("x-locale", locale);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
