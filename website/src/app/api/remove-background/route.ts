import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/request-session";

const WORKER_API_BASE = process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000";
const WORKER_INTERNAL_TOKEN = process.env.WORKER_INTERNAL_TOKEN;

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

function isIndexConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const details = error as { code?: number; codeName?: string; errmsg?: string; message?: string };
  return details.code === 85 || details.codeName === "IndexOptionsConflict" || /IndexOptionsConflict/i.test(details.errmsg || details.message || "");
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2, delayMs = 250): Promise<Response> {
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
  if (!mongoClient) {
    const uri = process.env.NEXT_MONGODB_URI;
    if (!uri) {
      throw new Error("NEXT_MONGODB_URI not configured");
    }
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    db = mongoClient.db("bgremover");
    
    try {
      await db.collection<UserUpload>("user_uploads").createIndex(
        { ip: 1, hourKey: 1 }
      );
    } catch (e) {
      if (!isIndexConflict(e)) {
        console.warn('createIndex(ip,hourKey) warning', e);
      }
    }

    try {
      await db.collection<UserUpload>("user_uploads").createIndex(
        { uploadedAt: 1 },
        { expireAfterSeconds: 3600 }
      );
    } catch (e) {
      // Ignore index option conflicts (e.g., existing TTL with different seconds)
      if (isIndexConflict(e)) {
        console.warn('TTL index exists with different options; continuing');
      } else {
        console.warn('createIndex(uploadedAt) warning', e);
      }
    }
  }
  return db!;
}

function getUserUploadsCollection(database: Db): Collection<UserUpload> {
  return database.collection<UserUpload>("user_uploads");
}

export async function POST(request: NextRequest) {
  const { sessionId, isNewSession } = getOrCreateSessionId(request);
  const clientKey = sessionId;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "_no_file", message: "No file provided" },
        { status: 400 }
      );
    }

    const db = await getMongoDB();
    const userUploads = getUserUploadsCollection(db);
    const hourKey = getHourKey();

    // Count uploads for this IP in current hour
    const hourStart = new Date(Date.now() - HOUR_WINDOW_MS);
    const userUploadCount = await userUploads.countDocuments({
      ip: clientKey,
      hourKey,
      uploadedAt: { $gte: hourStart },
    });

    // Check hourly limit (25 per IP per hour)
    if (userUploadCount >= HOURLY_LIMIT) {
      const hoursUntilReset = 1;
      return NextResponse.json({
        error: "_hourly_limit",
        message: `Hourly limit reached (${userUploadCount}/${HOURLY_LIMIT}). Try again in 1 hour.`,
        uploads_used: userUploadCount,
        uploads_limit: HOURLY_LIMIT,
        remaining: 0,
        resets_in_hours: hoursUntilReset,
      }, { status: 403 });
    }

    const workerFormData = new FormData();
    workerFormData.append("file", file);

    const workerResponse = await fetchWithRetry(`${WORKER_API_BASE}/remove?wait=false`, {
      method: "POST",
      body: workerFormData,
      headers: {
        ...(WORKER_INTERNAL_TOKEN ? { "x-internal-token": WORKER_INTERNAL_TOKEN } : {}),
        "x-client-ip": clientKey,
      },
    });

    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return NextResponse.json(data, { status: workerResponse.status });
    }

    const jobId = data.job_id;
    
    // Record this upload
    await userUploads.insertOne({
      ip: clientKey,
      fileName: file.name,
      uploadedAt: new Date(),
      hourKey,
    });

    const remaining = HOURLY_LIMIT - userUploadCount - 1;

    const response = NextResponse.json({ 
      job_id: jobId, 
      status: data.status || "queued",
      progress: data.progress ?? 0,
      uploads_used: userUploadCount + 1,
      uploads_limit: HOURLY_LIMIT,
      remaining,
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