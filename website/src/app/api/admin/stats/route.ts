import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;
const DB_NAME = process.env.NEXT_MONGODB_DB || "bgremover";

interface JobDocument {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  fileName: string;
  sessionId: string;
}

interface UserUpload {
  uploadedAt: Date;
  hourKey: string;
  ip?: string;
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
    const db = client.db(DB_NAME);

    const jobs = db.collection<JobDocument>("jobs");
    const creditUsage = db.collection("credit_usage");
    const userUploads = db.collection<UserUpload>("user_uploads");
    const ratings = db.collection("tool_ratings");

    // Get job stats
    const [totalJobs, completedJobs, failedJobs, queuedJobs, runningJobs, distinctJobUsers, distinctUploadUsers] = await Promise.all([
      jobs.countDocuments(),
      jobs.countDocuments({ status: "completed" }),
      jobs.countDocuments({ status: "failed" }),
      jobs.countDocuments({ status: "queued" }),
      jobs.countDocuments({ status: "running" }),
      jobs.distinct("sessionId"),
      userUploads.distinct("ip"),
    ]);

    const pendingJobs = queuedJobs + runningJobs;
    const totalUsers = new Set([...distinctJobUsers.filter(Boolean), ...distinctUploadUsers.filter(Boolean)]).size;
    const failureRate = totalJobs === 0 ? 0 : failedJobs / totalJobs;

    const [uploadsPerUserAgg, jobTrends, uploadTrends, ratingSummaryAgg] = await Promise.all([
      userUploads
        .aggregate([
          { $match: { ip: { $type: "string" } } },
          { $group: { _id: "$ip", uploads: { $sum: 1 } } },
          { $group: { _id: null, average: { $avg: "$uploads" }, max: { $max: "$uploads" }, users: { $sum: 1 } } },
        ])
        .toArray(),
      jobs
        .aggregate([
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
              pending: { $sum: { $cond: [{ $in: ["$status", ["queued", "running"]] }, 1, 0] } },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 14 },
        ])
        .toArray(),
      userUploads
        .aggregate([
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$uploadedAt" } }, uploads: { $sum: 1 } } },
          { $sort: { _id: -1 } },
          { $limit: 14 },
        ])
        .toArray(),
      ratings
        .aggregate([
          { $group: { _id: "$tool", average: { $avg: "$rating" }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray()
        .catch(() => []),
    ]);

    const uploadsPerUserDoc = uploadsPerUserAgg[0] ?? { average: 0, max: 0, users: 0 };
    const ratingSummary = ratingSummaryAgg.map((item) => ({
      tool: item._id || "unknown",
      average: Number((item.average ?? 0).toFixed(2)),
      count: item.count ?? 0,
    }));
    const toolUsage = [
      { tool: "remover", count: totalJobs },
      ...ratingSummary.map((item) => ({ tool: item.tool, count: item.count })),
    ].reduce<Array<{ tool: string; count: number }>>((acc, item) => {
      const existing = acc.find((entry) => entry.tool === item.tool);
      if (existing) {
        existing.count = Math.max(existing.count, item.count);
      } else {
        acc.push(item);
      }
      return acc;
    }, []);

    // Get usage stats — total credits consumed across all users in the current
    // hourly window, sourced from the authoritative `credit_usage` counter.
    const now = Date.now();
    const windowStart = Math.floor(now / HOUR_WINDOW_MS) * HOUR_WINDOW_MS;
    let totalUploads = 0;
    const resetInSeconds = getSecondsUntilReset(windowStart + HOUR_WINDOW_MS, now);
    try {
      const usageAgg = await creditUsage
        .aggregate([
          { $match: { windowStart, expiresAt: { $gt: new Date(now) } } },
          { $group: { _id: null, total: { $sum: "$used" } } },
        ])
        .toArray();
      totalUploads = usageAgg[0]?.total ?? 0;
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
      pendingJobs,
      totalUploads,
      hourlyLimit: HOURLY_LIMIT,
      remaining: Math.max(0, HOURLY_LIMIT - totalUploads),
      resetInSeconds,
      totalUsers,
      uploadsPerUser: {
        average: Number((uploadsPerUserDoc.average ?? 0).toFixed(2)),
        max: uploadsPerUserDoc.max ?? 0,
        users: uploadsPerUserDoc.users ?? 0,
      },
      failureRate,
      toolUsage,
      ratingSummary,
      trends: {
        jobs: jobTrends.reverse().map((item) => ({
          date: item._id,
          total: item.total,
          completed: item.completed,
          failed: item.failed,
          pending: item.pending,
        })),
        uploads: uploadTrends.reverse().map((item) => ({
          date: item._id,
          uploads: item.uploads,
        })),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
