import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const WORKER_API_BASE = process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000";

interface JobDocument {
  _id?: ObjectId;
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  resultPath?: string;
  error?: string;
  fileName: string;
  sessionId: string;
}

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

async function getMongoDB() {
  if (!mongoClient) {
    const uri = process.env.NEXT_MONGODB_URI;
    if (!uri) {
      throw new Error("NEXT_MONGODB_URI not configured");
    }
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    db = mongoClient.db("bgremover");
  }
  return db!;
}

function getJobsCollection(db: Db): Collection<JobDocument> {
  return db.collection<JobDocument>("jobs");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    const workerResponse = await fetch(`${WORKER_API_BASE}/status/${job_id}`);

    if (!workerResponse.ok) {
      const data = await workerResponse.json();
      return NextResponse.json(data, { status: workerResponse.status });
    }

    const statusData = await workerResponse.json();

    try {
      const db = await getMongoDB();
      const jobs = getJobsCollection(db);
      
      await jobs.updateOne(
        { jobId: job_id },
        {
          $set: {
            status: statusData.status,
            progress: statusData.progress,
            completedAt: statusData.status === "completed" || statusData.status === "failed" ? new Date() : undefined,
            error: statusData.error,
          },
        }
      );
    } catch (dbError) {
      console.error("MongoDB update error:", dbError);
    }

    return NextResponse.json({
      job_id: job_id,
      status: statusData.status,
      progress: statusData.progress,
      error: statusData.error,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "_internal_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}