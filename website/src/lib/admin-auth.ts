// Admin authentication and security utilities.

import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "qb_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  return password;
}

export function getAdminSessionToken(): string {
  return process.env.ADMIN_SESSION_TOKEN || getAdminPassword();
}

export function validateAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value === getAdminSessionToken();
}

export function setAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: getAdminSessionToken(),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
