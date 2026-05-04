import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/request-session";

const WORKER_API_BASE = process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000";

interface UserUpload {
  _id?: ObjectId;
  ip: string;
  fileName: string;
  uploadedAt: Date;
  hourKey: string;
}

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

const HOURLY_LIMIT = 25;
const HOUR_WINDOW_MS = 60 * 60 * 1000;

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

function getHourKey(): string {
  const now = new Date();
  const hour = Math.floor(now.getTime() / HOUR_WINDOW_MS);
  return `hour_${hour}`;
}

async function getMongoDB() {
  if (!mongoClient || !db) {
    const uri = process.env.NEXT_MONGODB_URI;
    if (!uri) {
      throw new Error("NEXT_MONGODB_URI not configured");
    }
    if (!mongoClient) {
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
    }

    db = mongoClient.db("bgremover");
  }

  if (!db) {
    throw new Error("Failed to initialize MongoDB connection");
  }

  return db;
}

function getUserUploadsCollection(database: Db): Collection<UserUpload> {
  return database.collection<UserUpload>("user_uploads");
}

export async function GET(request: NextRequest) {
  const { sessionId, isNewSession } = getOrCreateSessionId(request);
  const clientKey = sessionId;
  
  try {
    // Get worker status
    let workerStatus = { queue_length: 0, running_jobs: 0 };
    try {
      const workerResponse = await fetchWithRetry(`${WORKER_API_BASE}/queue-status`);
      if (workerResponse.ok) {
        workerStatus = await workerResponse.json();
      }
    } catch {
      // Ignore
    }

    let sessionStats = {
      uploads_used: 0,
      uploads_limit: HOURLY_LIMIT,
      remaining: HOURLY_LIMIT,
      in_queue: 0,
      completed: 0,
    };

    try {
      const mdb = await getMongoDB();
      const userUploads = getUserUploadsCollection(mdb);
      const hourKey = getHourKey();
      const hourStart = new Date(Date.now() - HOUR_WINDOW_MS);

      // Cleanup any leftover records older than 1 hour (defensive cleanup on visit)
      try {
        await userUploads.deleteMany({ uploadedAt: { $lt: hourStart } });
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }

      // Count THIS IP's uploads in current hour
      const userUploadCount = await userUploads.countDocuments({
        ip: clientKey,
        hourKey,
        uploadedAt: { $gte: hourStart },
      });

      sessionStats = {
        uploads_used: userUploadCount,
        uploads_limit: HOURLY_LIMIT,
        remaining: Math.max(0, HOURLY_LIMIT - userUploadCount),
        in_queue: 0,
        completed: userUploadCount,
      };
    } catch (e) {
      console.error("MongoDB error:", e);
    }

    const response = NextResponse.json({
      ...workerStatus,
      ...sessionStats,
    });

    if (isNewSession) {
      attachSessionCookie(response, sessionId);
    }

    return response;
  } catch (error) {
    console.error("API error:", error);
    const response = NextResponse.json(
      { error: "_internal_error", message: "Internal server error" },
      { status: 500 }
    );

    if (isNewSession) {
      attachSessionCookie(response, sessionId);
    }

    return response;
  }
}