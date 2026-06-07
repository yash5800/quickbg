import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSessionToken } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLogin = pathname === "/admin/login";
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = sessionToken === getAdminSessionToken();

  if (!isAuthenticated && isAdminPath && !isAdminLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isAuthenticated && isAdminLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};