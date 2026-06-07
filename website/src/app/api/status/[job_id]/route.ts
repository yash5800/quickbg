import { NextRequest, NextResponse } from "next/server";

const WORKER_API_BASE = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    const workerResponse = await fetch(`${WORKER_API_BASE}/status/${job_id}`, {
      cache: "no-store",
    });

    if (!workerResponse.ok) {
      const data = await workerResponse.json();
      return NextResponse.json(data, { status: workerResponse.status });
    }

    const statusData = await workerResponse.json();

    return NextResponse.json({
      job_id: job_id,
      status: statusData.status,
      progress: statusData.progress,
      error: statusData.error,
      queue_position: statusData.queue_position ?? null,
      estimated_wait_seconds: statusData.estimated_wait_seconds ?? null,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}