import { NextResponse } from "next/server";
import { setAdminSessionCookie, validateAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (validateAdminPassword(String(password || ""))) {
      const response = NextResponse.json({ success: true });
      setAdminSessionCookie(response);
      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}
