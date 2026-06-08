import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { attachSessionCookie, getClientIp, getOrCreateSessionId } from "@/lib/request-session";

const WORKER_API_BASE = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000").replace(/\/+$/, "");

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

// Persist client across hot reloads in dev by storing on global
declare global {
  // eslint-disable-next-line no-var
  var __bgremover_mongo_client: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __bgremover_mongo_db: Db | undefined;
}

type MongoGlobal = typeof globalThis & {
  __bgremover_mongo_client?: MongoClient;
  __bgremover_mongo_db?: Db;
};

const mongoGlobal = globalThis as MongoGlobal;

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


function getSecondsUntilReset(resetAtMs: number, nowMs: number = Date.now()): number {
  return Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
}

async function getMongoDB() {
  const uri = process.env.NEXT_MONGODB_URI;
  if (!uri) {
    throw new Error("NEXT_MONGODB_URI not configured");
  }

  // If there's an existing client, verify it's alive with a ping.
  if (mongoGlobal.__bgremover_mongo_client && mongoGlobal.__bgremover_mongo_db) {
    try {
      await mongoGlobal.__bgremover_mongo_client.db("admin").command({ ping: 1 });
      return mongoGlobal.__bgremover_mongo_db;
    } catch {
      // existing client appears dead; close and recreate below
      try {
        await mongoGlobal.__bgremover_mongo_client.close();
      } catch {}
      mongoGlobal.__bgremover_mongo_client = undefined;
      mongoGlobal.__bgremover_mongo_db = undefined;
    }
  }

  // Create and connect a new client
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.NEXT_MONGODB_DB || "bgremover";
  const database = client.db(dbName);

  // persist on global to survive module reloads in dev
  mongoGlobal.__bgremover_mongo_client = client;
  mongoGlobal.__bgremover_mongo_db = database;

  return database;
}

function getUserUploadsCollection(database: Db): Collection<UserUpload> {
  return database.collection<UserUpload>("user_uploads");
}

function getHourlyUsageCollection(database: Db): Collection<HourlyUsage> {
  return database.collection<HourlyUsage>("hourly_usage");
}

export async function GET(request: NextRequest) {
  const { sessionId, isNewSession } = getOrCreateSessionId(request);
  const clientKey = getClientIp(request) || sessionId;
  
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
      reset_in_seconds: getSecondsUntilReset(Date.now() + HOUR_WINDOW_MS),
    };

    try {
      const mdb = await getMongoDB();
      const userUploads = getUserUploadsCollection(mdb);
      const hourlyUsage = getHourlyUsageCollection(mdb);
      const hourStart = new Date(Date.now() - HOUR_WINDOW_MS);

      // Cleanup any leftover records older than 1 hour (defensive cleanup on visit)
      try {
        await userUploads.deleteMany({ uploadedAt: { $lt: hourStart } });
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }

      const now = Date.now();
      const activeUsage = await hourlyUsage.findOne(
        { ip: clientKey, expiresAt: { $gt: new Date(now) } },
        { projection: { count: 1, expiresAt: 1 } }
      );

      let userUploadCount = Math.min(HOURLY_LIMIT, activeUsage?.count ?? 0);
      let resetInSeconds = activeUsage?.expiresAt ? getSecondsUntilReset(activeUsage.expiresAt.getTime(), now) : getSecondsUntilReset(now + HOUR_WINDOW_MS, now);

      if (!activeUsage) {
        const legacyCount = await userUploads.countDocuments({
          ip: clientKey,
          uploadedAt: { $gte: hourStart },
        });
        userUploadCount = Math.min(HOURLY_LIMIT, legacyCount);

        const recentUploads = await userUploads
          .find(
            {
              ip: clientKey,
              uploadedAt: { $gte: hourStart },
            },
            { projection: { uploadedAt: 1 } }
          )
          .sort({ uploadedAt: 1 })
          .toArray();

        if (recentUploads.length > 0) {
          resetInSeconds = getSecondsUntilReset(recentUploads[0].uploadedAt.getTime() + HOUR_WINDOW_MS, now);
        }
      }

      sessionStats = {
        uploads_used: userUploadCount,
        uploads_limit: HOURLY_LIMIT,
        remaining: Math.max(0, HOURLY_LIMIT - userUploadCount),
        in_queue: 0,
        completed: userUploadCount,
        reset_in_seconds: resetInSeconds,
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