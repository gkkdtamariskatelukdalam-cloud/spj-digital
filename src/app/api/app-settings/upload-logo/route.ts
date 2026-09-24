import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "image/svg+xml": "svg",
};

// POST /api/app-settings/upload-logo
// Upload app logo (for login page + favicon). Admin only.
// Stores as base64 data URL in AppSettings.appLogo (Vercel serverless
// compatible — no filesystem writes).
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 },
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, WebP, GIF, ICO, SVG are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 },
      );
    }

    // Convert to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Upsert AppSettings
    const existing = await db.appSettings.findFirst();
    if (existing) {
      await db.appSettings.update({
        where: { id: existing.id },
        data: { appLogo: dataUrl },
      });
    } else {
      await db.appSettings.create({
        data: { appLogo: dataUrl },
      });
    }

    return NextResponse.json({
      appLogo: dataUrl,
      size: file.size,
      storedAs: "base64",
    });
  } catch (e) {
    console.error("Upload app logo error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
