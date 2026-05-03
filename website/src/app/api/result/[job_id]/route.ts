import { NextRequest, NextResponse } from "next/server";

const WORKER_API_BASE = process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;
    
    // First check status
    const statusResponse = await fetch(`${WORKER_API_BASE}/status/${job_id}`, {
      cache: "no-store",
    });
    if (!statusResponse.ok) {
      const data = await statusResponse.json();
      return NextResponse.json(data, { status: statusResponse.status });
    }

    const statusData = await statusResponse.json();
    if (statusData.status !== "completed") {
      return NextResponse.json(
        { error: "_not_completed", message: "Job not completed", status: statusData.status },
        { status: 409 }
      );
    }

    // Fetch the actual image from worker
    const workerResponse = await fetch(`${WORKER_API_BASE}/result/${job_id}`, {
      cache: "no-store",
    });

    if (!workerResponse.ok) {
      return NextResponse.json(
        { error: "_result_not_found", message: "Result not found" },
        { status: 404 }
      );
    }

    // Return the image as a stream
    const headers = new Headers();
    workerResponse.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    return new NextResponse(workerResponse.body, {
      status: 200,
      headers: {
        ...Object.fromEntries(headers.entries()),
        "Content-Disposition": `attachment; filename="${job_id}.png"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "_internal_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}