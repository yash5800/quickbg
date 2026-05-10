import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;

interface JobDocument {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  fileName: string;
  sessionId: string;
}

interface HourlyUsage {
  count: number;
}

interface UserUpload {
  uploadedAt: Date;
  hourKey: string;
}

const HOURLY_LIMIT = 25;
const HOUR_WINDOW_MS = 60 * 60 * 1000;

function getHourKey(): string {
  const now = new Date();
  const hour = Math.floor(now.getTime() / HOUR_WINDOW_MS);
  return `hour_${hour}`;
}

function getSecondsUntilHourReset(): number {
  const nowMs = Date.now();
  const nextHourMs = (Math.floor(nowMs / HOUR_WINDOW_MS) + 1) * HOUR_WINDOW_MS;
  return Math.max(1, Math.ceil((nextHourMs - nowMs) / 1000));
}

export async function GET() {
  if (!MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("bgremover");

    const jobs = db.collection<JobDocument>("jobs");
    const hourlyUsage = db.collection<HourlyUsage>("hourly_usage");
    const userUploads = db.collection<UserUpload>("user_uploads");

    const hourKey = getHourKey();
    const hourStart = new Date(Date.now() - HOUR_WINDOW_MS);

    // Get job stats
    const [totalJobs, completedJobs, failedJobs, queuedJobs, runningJobs] = await Promise.all([
      jobs.countDocuments(),
      jobs.countDocuments({ status: "completed" }),
      jobs.countDocuments({ status: "failed" }),
      jobs.countDocuments({ status: "queued" }),
      jobs.countDocuments({ status: "running" }),
    ]);

    // Get usage stats
    let totalUploads = 0;
    try {
      const usage = await hourlyUsage.findOne({ hourKey });
      totalUploads = Math.min(HOURLY_LIMIT, usage?.count ?? 0);

      if (!usage) {
        const legacyCount = await userUploads.countDocuments({
          hourKey,
          uploadedAt: { $gte: hourStart },
        });
        totalUploads = Math.min(HOURLY_LIMIT, legacyCount);
      }
    } catch {
      totalUploads = 0;
    }

    await client.close();

    return NextResponse.json({
      totalJobs,
      completedJobs,
      failedJobs,
      queuedJobs,
      runningJobs,
      totalUploads,
      hourlyLimit: HOURLY_LIMIT,
      remaining: Math.max(0, HOURLY_LIMIT - totalUploads),
      resetInSeconds: getSecondsUntilHourReset(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}