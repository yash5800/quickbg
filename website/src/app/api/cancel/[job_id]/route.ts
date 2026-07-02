import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WORKER_API_BASE = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const WORKER_INTERNAL_TOKEN = process.env.WORKER_INTERNAL_TOKEN;

// Public: a user cancels their own job. The job id is the capability, so no
// admin auth — but we still forward the internal token so the worker accepts it
// when the worker is locked down.
export async function POST(_request: NextRequest, { params }: { params: { job_id: string } }) {
  const jobId = params.job_id;
  if (!jobId) {
    return NextResponse.json({ error: "job_id required" }, { status: 400 });
  }

  try {
    const workerResponse = await fetch(`${WORKER_API_BASE}/cancel/${encodeURIComponent(jobId)}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        ...(WORKER_INTERNAL_TOKEN ? { "x-internal-token": WORKER_INTERNAL_TOKEN } : {}),
      },
    });

    if (!workerResponse.ok) {
      return NextResponse.json({ error: "Failed to cancel job" }, { status: workerResponse.status });
    }

    return NextResponse.json(await workerResponse.json());
  } catch (error) {
    console.error("Cancel API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
