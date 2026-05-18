import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/request-session";

export const dynamic = "force-dynamic";

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

function getWindowKey(nowMs: number = Date.now()): string {
  return `window_${nowMs}`;
}

function getSecondsUntilReset(resetAtMs: number, nowMs: number = Date.now()): number {
  return Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
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

    db = mongoClient.db("testbgremover");
    
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
): Promise<{ allowed: boolean; used: number; resetAt: number; hourKey: string }> {
  const now = Date.now();
  const nowDate = new Date(now);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const activeUsage = await collection.findOne(
      { ip: clientKey, expiresAt: { $gt: nowDate } },
      { projection: { count: 1, expiresAt: 1, hourKey: 1 } }
    );

    if (activeUsage) {
      if (activeUsage.count >= HOURLY_LIMIT) {
        return {
          allowed: false,
          used: activeUsage.count,
          resetAt: activeUsage.expiresAt.getTime(),
          hourKey: activeUsage.hourKey,
        };
      }

      const updated = await collection.findOneAndUpdate(
        {
          _id: activeUsage._id,
          expiresAt: { $gt: nowDate },
          count: { $lt: HOURLY_LIMIT },
        },
        {
          $inc: { count: 1 },
          $set: { updatedAt: nowDate },
        },
        {
          returnDocument: "after",
        }
      );

      if (updated) {
        return {
          allowed: true,
          used: updated.count,
          resetAt: updated.expiresAt.getTime(),
          hourKey: updated.hourKey,
        };
      }

      continue;
    }

    const resetAt = new Date(now + HOUR_WINDOW_MS);
    const hourKey = getWindowKey(now);

    try {
      const reserved = await collection.findOneAndUpdate(
        {
          ip: clientKey,
          hourKey,
        },
        {
          $inc: { count: 1 },
          $set: { updatedAt: nowDate, expiresAt: resetAt },
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
        return {
          allowed: true,
          used: reserved.count,
          resetAt: reserved.expiresAt.getTime(),
          hourKey: reserved.hourKey,
        };
      }
    } catch (error) {
      const details = error as { code?: number; codeName?: string };
      const isDuplicateKey = details.code === 11000 || details.codeName === "DuplicateKey";
      if (!isDuplicateKey) {
        throw error;
      }
    }
  }

  const existing = await collection.findOne(
    { ip: clientKey, expiresAt: { $gt: new Date() } },
    { projection: { count: 1, expiresAt: 1, hourKey: 1 } }
  );

  return {
    allowed: false,
    used: existing?.count ?? HOURLY_LIMIT,
    resetAt: existing?.expiresAt?.getTime() ?? now + HOUR_WINDOW_MS,
    hourKey: existing?.hourKey ?? getWindowKey(now),
  };
}

export async function POST(request: NextRequest) {
  const { sessionId, isNewSession } = getOrCreateSessionId(request);
  const clientKey = sessionId;

  try {
    const formData = await request.formData();
    const reserveOnly = formData.get("reserveOnly") === "true";

    if (!reserveOnly) {
      return NextResponse.json(
        { error: "_reserve_only_required", message: "This endpoint only reserves upload credits" },
        { status: 400 }
      );
    }

    const db = await getMongoDB();
    const userUploads = getUserUploadsCollection(db);
    const hourlyUsage = getHourlyUsageCollection(db);
    const slotReservation = await reserveHourlyUploadSlot(hourlyUsage, clientKey);
    const resetInSeconds = getSecondsUntilReset(slotReservation.resetAt);

    if (!slotReservation.allowed) {
      return NextResponse.json({
        error: "_hourly_limit",
        message: `Hourly limit reached (${slotReservation.used}/${HOURLY_LIMIT}). Visit after 1 hour from your first upload.`,
        uploads_used: slotReservation.used,
        uploads_limit: HOURLY_LIMIT,
        remaining: 0,
        retry_after: resetInSeconds,
        reset_in_seconds: resetInSeconds,
      }, { status: 403 });
    }

    const remaining = Math.max(0, HOURLY_LIMIT - slotReservation.used);

    await userUploads.insertOne({
      ip: clientKey,
      fileName: "direct-worker-upload",
      uploadedAt: new Date(),
      hourKey: slotReservation.hourKey,
    });

    const response = NextResponse.json({
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