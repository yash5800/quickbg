import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, getClientIp, getOrCreateSessionId } from "@/lib/request-session";
import { getUsage, HOURLY_LIMIT } from "@/lib/credits-server";

export const dynamic = "force-dynamic";

const WORKER_API_BASE = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2, delayMs = 250): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Worker request failed");
}

export async function GET(request: NextRequest) {
  const { sessionId, isNewSession } = getOrCreateSessionId(request);
  const clientKey = getClientIp(request) || sessionId;

  // Worker queue info (best-effort; never blocks the credit read).
  let workerStatus = { queue_length: 0, running_jobs: 0 };
  try {
    const workerResponse = await fetchWithRetry(`${WORKER_API_BASE}/queue-status`);
    if (workerResponse.ok) {
      workerStatus = await workerResponse.json();
    }
  } catch {
    // Ignore worker errors — credits are independent of worker availability.
  }

  // Authoritative credit state — the single source of truth.
  let credits = {
    uploads_used: 0,
    uploads_limit: HOURLY_LIMIT,
    remaining: HOURLY_LIMIT,
    reset_in_seconds: 3600,
  };
  try {
    const state = await getUsage(clientKey);
    credits = {
      uploads_used: state.used,
      uploads_limit: HOURLY_LIMIT,
      remaining: state.remaining,
      reset_in_seconds: state.resetInSeconds,
    };
  } catch (error) {
    console.error("[queue-status] credit read error", error);
  }

  const response = NextResponse.json({ ...workerStatus, ...credits });

  if (isNewSession) {
    attachSessionCookie(response, sessionId);
  }

  return response;
}
