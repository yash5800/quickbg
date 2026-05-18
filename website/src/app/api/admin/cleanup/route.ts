import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;

interface JobDocument {
  createdAt: Date;
  status: string;
}

export async function POST(request: NextRequest) {
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

    // Delete jobs older than 7 days that are completed or failed
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const result = await jobs.deleteMany({
      createdAt: { $lt: cutoff },
      status: { $in: ["completed", "failed"] },
    });

    await client.close();

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
