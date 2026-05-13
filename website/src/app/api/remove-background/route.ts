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

interface HourlyUsage {
  _id?: ObjectId;
  ip: string;
  hourKey: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
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

function getSecondsUntilHourReset(nowMs: number = Date.now()): number {
  const nextHourMs = (Math.floor(nowMs / HOUR_WINDOW_MS) + 1) * HOUR_WINDOW_MS;
  return Math.max(1, Math.ceil((nextHourMs - nowMs) / 1000));
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

    try {
      await db.collection<HourlyUsage>("hourly_usage").createIndex(
        { ip: 1, hourKey: 1 },
        { unique: true }
      );
    } catch (e) {
      if (!isIndexConflict(e)) {
        console.warn("createIndex(hourly_usage ip,hourKey) warning", e);
      }
    }

    try {
      await db.collection<HourlyUsage>("hourly_usage").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );
    } catch (e) {
      if (isIndexConflict(e)) {
        console.warn("hourly_usage TTL index exists with different options; continuing");
      } else {
        console.warn("createIndex(hourly_usage expiresAt) warning", e);
      }
    }
  }

  if (!db) {
    throw new Error("Failed to initialize MongoDB connection");
  }

  return db;
}

function getUserUploadsCollection(database: Db): Collection<UserUpload> {
  return database.collection<UserUpload>("user_uploads");
}

function getHourlyUsageCollection(database: Db): Collection<HourlyUsage> {
  return database.collection<HourlyUsage>("hourly_usage");
}

async function reserveHourlyUploadSlot(
  collection: Collection<HourlyUsage>,
  clientKey: string,
  hourKey: string,
): Promise<{ allowed: boolean; used: number }> {
  const now = Date.now();
  const nowDate = new Date(now);
  const expiresAt = new Date((Math.floor(now / HOUR_WINDOW_MS) + 1) * HOUR_WINDOW_MS);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const reserved = await collection.findOneAndUpdate(
        {
          ip: clientKey,
          hourKey,
          count: { $lt: HOURLY_LIMIT },
        },
        {
          $inc: { count: 1 },
          $set: { updatedAt: nowDate, expiresAt },
          $setOnInsert: {
            ip: clientKey,
            hourKey,
            createdAt: nowDate,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      if (reserved) {
        return { allowed: true, used: reserved.count };
      }

      const existing = await collection.findOne(
        { ip: clientKey, hourKey },
        { projection: { count: 1 } }
      );

      return {
        allowed: false,
        used: existing?.count ?? HOURLY_LIMIT,
      };
    } catch (error) {
      const details = error as { code?: number; codeName?: string };
      const isDuplicateKey = details.code === 11000 || details.codeName === "DuplicateKey";
      if (!isDuplicateKey) {
        throw error;
      }
    }
  }

  const existing = await collection.findOne(
    { ip: clientKey, hourKey },
    { projection: { count: 1 } }
  );

  return {
    allowed: false,
    used: existing?.count ?? HOURLY_LIMIT,
  };
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
    const hourlyUsage = getHourlyUsageCollection(db);
    const hourKey = getHourKey();
    const resetInSeconds = getSecondsUntilHourReset();

    const slotReservation = await reserveHourlyUploadSlot(hourlyUsage, clientKey, hourKey);

    if (!slotReservation.allowed) {
      return NextResponse.json({
        error: "_hourly_limit",
        message: `Hourly limit reached (${slotReservation.used}/${HOURLY_LIMIT}). Visit after 1 hour.`,
        uploads_used: slotReservation.used,
        uploads_limit: HOURLY_LIMIT,
        remaining: 0,
        retry_after: resetInSeconds,
        reset_in_seconds: resetInSeconds,
      }, { status: 403 });
    }

    const workerFormData = new FormData();
    workerFormData.append("file", file);

    const workerResponse = await fetchWithRetry(`${WORKER_API_BASE}/remove`, {
      method: "POST",
      body: workerFormData,
      headers: {
        ...(WORKER_INTERNAL_TOKEN ? { "x-internal-token": WORKER_INTERNAL_TOKEN } : {}),
        "x-client-ip": clientKey,
      },
    });

    const contentType = workerResponse.headers.get("content-type") || "";

    if (contentType.includes("image/")) {
      await userUploads.insertOne({
        ip: clientKey,
        fileName: file.name,
        uploadedAt: new Date(),
        hourKey,
      });

      const imageBuffer = await workerResponse.arrayBuffer();
      const response = new NextResponse(imageBuffer, {
        status: workerResponse.status,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": workerResponse.headers.get("content-disposition") || "inline",
          ...(workerResponse.headers.get("x-job-id") ? { "X-Job-Id": workerResponse.headers.get("x-job-id")! } : {}),
        },
      });

      if (isNewSession) {
        attachSessionCookie(response, sessionId);
      }

      return response;
    }

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

    const remaining = Math.max(0, HOURLY_LIMIT - slotReservation.used);

    const response = NextResponse.json({ 
      job_id: jobId, 
      status: data.status || "queued",
      uploads_used: slotReservation.used,
      uploads_limit: HOURLY_LIMIT,
      remaining,
      retry_after: resetInSeconds,
      reset_in_seconds: resetInSeconds,
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