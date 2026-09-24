import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/app-settings — returns app settings (including appLogo)
// Public endpoint (no auth required) — the login page needs the logo
// before the user is authenticated.
export async function GET() {
  try {
    let settings = await db.appSettings.findFirst();
    if (!settings) {
      settings = await db.appSettings.create({ data: {} });
    }
    return NextResponse.json({
      appLogo: settings.appLogo || null,
    });
  } catch (e) {
    console.error("GET app-settings error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// PUT /api/app-settings — update app settings (admin only)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { appLogo } = body as { appLogo?: string };

    const update: Record<string, unknown> = {};
    if (typeof appLogo === "string") update.appLogo = appLogo || null;

    let settings = await db.appSettings.findFirst();
    if (settings) {
      settings = await db.appSettings.update({
        where: { id: settings.id },
        data: update,
      });
    } else {
      settings = await db.appSettings.create({ data: update });
    }
    return NextResponse.json({ appLogo: settings.appLogo });
  } catch (e) {
    console.error("PUT app-settings error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
