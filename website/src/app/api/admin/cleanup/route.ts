import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db } from "mongodb";

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

const HOUR_WINDOW_MS = 60 * 60 * 1000;
const ADMIN_CLEANUP_TOKEN = process.env.ADMIN_CLEANUP_TOKEN;

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!ADMIN_CLEANUP_TOKEN) {
    return false;
  }

  return request.headers.get("x-admin-token") === ADMIN_CLEANUP_TOKEN;
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

// Cleanup old records - call this periodically or via cron
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "_unauthorized", message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const mdb = await getMongoDB();
    const jobs = mdb.collection("jobs");
    const userUploads = mdb.collection("user_uploads");
    
    const hourAgo = new Date(Date.now() - HOUR_WINDOW_MS);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Delete old jobs (older than 1 day)
    const jobsResult = await jobs.deleteMany({
      createdAt: { $lt: dayAgo }
    });
    
    // Delete old user uploads (older than 1 hour - they expire naturally with TTL index)
    // But we can also manually clean any stuck records
    const uploadsResult = await userUploads.deleteMany({
      uploadedAt: { $lt: hourAgo }
    });
    
    return NextResponse.json({
      success: true,
      jobs_deleted: jobsResult.deletedCount,
      uploads_cleaned: uploadsResult.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "_cleanup_error", message: "Cleanup failed" },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}