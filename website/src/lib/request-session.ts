import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "bgremover_session";

export function getOrCreateSessionId(request: NextRequest): {
  sessionId: string;
  isNewSession: boolean;
} {
  const existingSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();

  if (existingSessionId) {
    return {
      sessionId: existingSessionId,
      isNewSession: false,
    };
  }

  return {
    sessionId: randomUUID(),
    isNewSession: true,
  };
}

export function attachSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}