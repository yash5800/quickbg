import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, getClientIp, getOrCreateSessionId } from "@/lib/request-session";
import { consumeCredit, recordUploadAnalytics, HOURLY_LIMIT } from "@/lib/credits-server";

export const dynamic = "force-dynamic";

async function readImageId(request: NextRequest): Promise<string | null> {
  try {
    const body = await request.json();
    const imageId = typeof body?.imageId === "string" ? body.imageId.trim() : "";
    return imageId || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { sessionId, isNewSession } = getOrCreateSessionId(request);
  const clientKey = getClientIp(request) || sessionId;

  const finalize = (response: NextResponse) => {
    if (isNewSession) {
      attachSessionCookie(response, sessionId);
    }
    return response;
  };

  try {
    const imageId = await readImageId(request);
    if (!imageId) {
      return finalize(
        NextResponse.json(
          { error: "_image_id_required", message: "imageId is required" },
          { status: 400 }
        )
      );
    }

    const state = await consumeCredit(clientKey, imageId);

    if (!state.allowed) {
      return finalize(
        NextResponse.json(
          {
            error: "_hourly_limit",
            message: `Hourly limit reached (${state.used}/${HOURLY_LIMIT}). Visit after 1 hour.`,
            uploads_used: state.used,
            uploads_limit: HOURLY_LIMIT,
            remaining: 0,
            retry_after: state.resetInSeconds,
            reset_in_seconds: state.resetInSeconds,
          },
          { status: 403 }
        )
      );
    }

    // Best-effort analytics; never blocks or affects the credit result.
    await recordUploadAnalytics(clientKey);

    return finalize(
      NextResponse.json({
        uploads_used: state.used,
        uploads_limit: HOURLY_LIMIT,
        remaining: state.remaining,
        retry_after: state.resetInSeconds,
        reset_in_seconds: state.resetInSeconds,
      })
    );
  } catch (error) {
    console.error("[credits/consume] error", error);
    return finalize(
      NextResponse.json(
        { error: "_internal_error", message: "Internal server error" },
        { status: 500 }
      )
    );
  }
}
