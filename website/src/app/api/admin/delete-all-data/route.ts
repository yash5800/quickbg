import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;

export async function DELETE(request: NextRequest) {
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

    // Delete all user uploads
    const uploadsResult = await db.collection("user_uploads").deleteMany({});
    
    // Delete all hourly usage records
    const usageResult = await db.collection("hourly_usage").deleteMany({});
    
    // Delete all jobs
    const jobsResult = await db.collection("jobs").deleteMany({});

    await client.close();

    return NextResponse.json({
      success: true,
      deletedCounts: {
        user_uploads: uploadsResult.deletedCount,
        hourly_usage: usageResult.deletedCount,
        jobs: jobsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete all data error:", error);
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
