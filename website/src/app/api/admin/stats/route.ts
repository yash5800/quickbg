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

interface HourlyUsage {
  count: number;
  expiresAt?: Date;
}

interface UserUpload {
  uploadedAt: Date;
  hourKey: string;
}

const HOURLY_LIMIT = 25;
const HOUR_WINDOW_MS = 60 * 60 * 1000;

function getSecondsUntilReset(resetAtMs: number, nowMs: number = Date.now()): number {
  return Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("testbgremover");

    const jobs = db.collection<JobDocument>("jobs");
    const hourlyUsage = db.collection<HourlyUsage>("hourly_usage");
    const userUploads = db.collection<UserUpload>("user_uploads");

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
    let resetInSeconds = getSecondsUntilReset(Date.now() + HOUR_WINDOW_MS);
    try {
      const now = Date.now();
      const usage = await hourlyUsage.findOne({ expiresAt: { $gt: new Date(now) } });
      totalUploads = Math.min(HOURLY_LIMIT, usage?.count ?? 0);

      if (usage?.expiresAt) {
        resetInSeconds = getSecondsUntilReset(usage.expiresAt.getTime(), now);
      }

      if (!usage) {
        const legacyCount = await userUploads.countDocuments({
          uploadedAt: { $gte: hourStart },
        });
        totalUploads = Math.min(HOURLY_LIMIT, legacyCount);

        const recentUpload = await userUploads
          .find(
            {
              uploadedAt: { $gte: hourStart },
            },
            { projection: { uploadedAt: 1 } }
          )
          .sort({ uploadedAt: 1 })
          .limit(1)
          .toArray();

        if (recentUpload[0]?.uploadedAt) {
          resetInSeconds = getSecondsUntilReset(recentUpload[0].uploadedAt.getTime() + HOUR_WINDOW_MS, now);
        }
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
      resetInSeconds,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}