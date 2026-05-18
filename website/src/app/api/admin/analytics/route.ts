import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;

// Rate limiting for admin routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function sanitizeString(str: string): string {
  // Remove potential SQL injection characters and limit length
  return str.replace(/[${}()\\;'"]/g, "").slice(0, 100);
}

export async function GET(request: NextRequest) {
  // Security: Check authentication
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Security: Rate limiting
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (!MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("testbgremover");

    const analytics = db.collection("analytics");

    // Build query with sanitization
    const query: Record<string, unknown> = {};

    if (startDate) {
      query.date = { $gte: sanitizeString(startDate) };
    }
    if (endDate) {
      query.date = { ...(query.date as object || {}), $lte: sanitizeString(endDate) };
    }

    const docs = await analytics
      .find(query)
      .sort({ date: -1 })
      .limit(days)
      .toArray();

    // Calculate totals
    const totals = docs.reduce(
      (acc, doc) => ({
        totalJobs: acc.totalJobs + (doc.jobs || 0),
        totalUniqueUsers: acc.totalUniqueUsers + (doc.unique_users || 0),
      }),
      { totalJobs: 0, totalUniqueUsers: 0 }
    );

    // Calculate hourly totals across all days
    const hourlyTotals = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      jobs: 0,
      users: 0,
    }));

    docs.forEach((doc) => {
      if (doc.hours) {
        for (let h = 0; h < 24; h++) {
          const key = h.toString().padStart(2, "0");
          if (doc.hours[key]) {
            hourlyTotals[h].jobs += doc.hours[key].jobs || 0;
            hourlyTotals[h].users += doc.hours[key].users || 0;
          }
        }
      }
    });

    await client.close();

    return NextResponse.json({
      data: docs,
      totals,
      hourlyTotals,
      period: { days, startDate: startDate || null, endDate: endDate || null },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const confirmCode = searchParams.get("confirm");
    const expectedCode = process.env.ANALYTICS_DELETE_CONFIRM || "CONFIRM";

    if (confirmCode !== expectedCode) {
      return NextResponse.json({ error: "Invalid confirmation code" }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("testbgremover");

    const analytics = db.collection("analytics");
    const analyticsSeen = db.collection("analytics_seen");

    const [analyticsCount, seenCount] = await Promise.all([
      analytics.deleteMany({}),
      analyticsSeen.deleteMany({}),
    ]);

    await client.close();

    return NextResponse.json({
      success: true,
      deletedCounts: {
        analytics: analyticsCount.deletedCount,
        seenRecords: seenCount.deletedCount,
      },
    });
  } catch (error) {
    console.error("Analytics delete error:", error);
    return NextResponse.json({ error: "Failed to delete analytics" }, { status: 500 });
  }
}
