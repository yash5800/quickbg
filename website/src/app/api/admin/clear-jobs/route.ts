import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const WORKER_API_BASE = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const WORKER_INTERNAL_TOKEN = process.env.WORKER_INTERNAL_TOKEN;

// Admin kill switch: cancel all queued/running jobs and stop in-flight worker
// tasks. Guarded by the admin session, and authenticates to the worker with the
// internal token.
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workerResponse = await fetch(`${WORKER_API_BASE}/admin/clear-jobs`, {
      method: "POST",
      cache: "no-store",
      headers: {
        ...(WORKER_INTERNAL_TOKEN ? { "x-internal-token": WORKER_INTERNAL_TOKEN } : {}),
      },
    });

    if (!workerResponse.ok) {
      return NextResponse.json(
        { error: "Worker rejected clear-jobs request" },
        { status: workerResponse.status }
      );
    }

    return NextResponse.json(await workerResponse.json());
  } catch (error) {
    console.error("Clear-jobs API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
