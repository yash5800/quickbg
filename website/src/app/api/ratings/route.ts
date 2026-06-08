import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { getOrCreateSessionId } from "@/lib/request-session";

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.NEXT_MONGODB_URI;
const DB_NAME = process.env.NEXT_MONGODB_DB || "bgremover";

const VALID_TOOLS = new Set([
  "remover",
  "eraser",
  "blur-bg",
  "replace-bg",
  "adjust",
  "sharpness",
  "watermark",
  "border",
  "converter",
]);

export async function POST(request: NextRequest) {
  if (!MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const tool = typeof body.tool === "string" ? body.tool.slice(0, 40) : "";
    const rating = Number(body.rating);

    if (!VALID_TOOLS.has(tool) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    await db.collection("tool_ratings").insertOne({
      tool,
      rating,
      imageId: typeof body.imageId === "string" ? body.imageId.slice(0, 120) : null,
      jobId: typeof body.jobId === "string" ? body.jobId.slice(0, 120) : null,
      sessionId: getOrCreateSessionId(request).sessionId,
      createdAt: new Date(),
      userAgent: request.headers.get("user-agent")?.slice(0, 240) ?? null,
    });

    await client.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rating submit error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
