import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;

interface JobDocument {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  fileName: string;
  sessionId: string;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json([], { status: 401 });
  }

  if (!MONGODB_URI) {
    return NextResponse.json([]);
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("testbgremover");
    const jobs = db.collection<JobDocument>("jobs");

    // Get recent jobs (last 50)
    const recentJobs = await jobs
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    await client.close();

    return NextResponse.json(
      recentJobs.map((job) => ({
        id: job.jobId,
        fileName: job.fileName,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        duration: job.completedAt
          ? job.completedAt.getTime() - job.createdAt.getTime()
          : undefined,
      }))
    );
  } catch (error) {
    console.error("Recent jobs error:", error);
    return NextResponse.json([]);
  }
}