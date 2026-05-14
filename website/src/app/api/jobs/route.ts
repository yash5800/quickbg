import { NextRequest, NextResponse } from "next/server";

const WORKER_API_BASE = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const WORKER_INTERNAL_TOKEN = process.env.WORKER_INTERNAL_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";
    const skip = searchParams.get("skip") || "0";

    const workerResponse = await fetch(`${WORKER_API_BASE}/jobs?limit=${limit}&skip=${skip}`, {
        cache: "no-store",
        headers: {
            "x-client-ip": request.headers.get("x-client-ip") || "anonymous",
            ...(WORKER_INTERNAL_TOKEN ? { "x-internal-token": WORKER_INTERNAL_TOKEN } : {}),
        }
    });

    if (!workerResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: workerResponse.status });
    }

    const data = await workerResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}