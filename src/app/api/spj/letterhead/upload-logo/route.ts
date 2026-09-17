import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/spj/letterhead/upload-logo
// Accepts multipart form data with a file field "logo"
//
// ⚠️ Vercel serverless note:
// The Vercel serverless function filesystem is READ-ONLY (EROFS error
// when trying to write to /var/task/public/uploads/...). So instead of
// writing the uploaded logo to disk, we encode it as a base64 data URL
// and store it directly in the `logoPath` (or `logo2Path`) column.
//
// `<img src="data:image/png;base64,...">` works exactly like
// `<img src="/uploads/logo.png">` from the browser's perspective —
// so the letterhead.tsx component needs NO changes.
//
// Trade-off: this slightly inflates the Neon DB row size (logos are
// typically < 500 KB, well within PostgreSQL's TEXT column limit of
// 1 GB). For larger files, switch to Vercel Blob (@vercel/blob).

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 },
      );
    }

    // Validate file type
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only PNG, JPEG, WebP, GIF are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 },
      );
    }

    // Convert file → base64 data URL (no filesystem write needed)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Check if this is logo2 upload (via query param ?logo=2)
    const url = new URL(req.url);
    const isLogo2 = url.searchParams.get("logo") === "2";
    const pathField = isLogo2 ? "logo2Path" : "logoPath";

    // Upsert letterhead settings row, storing the base64 data URL in the
    // logo path field. (The frontend <img src={logoPath}> will render
    // both relative paths AND data URLs transparently.)
    const existing = await db.letterheadSettings.findFirst();
    if (existing) {
      await db.letterheadSettings.update({
        where: { id: existing.id },
        data: { [pathField]: dataUrl },
      });
    } else {
      await db.letterheadSettings.create({
        data: { [pathField]: dataUrl },
      });
    }

    return NextResponse.json({
      logoPath: dataUrl,
      size: file.size,
      isLogo2,
      // Indicator that the value is a data URL (useful for the client to
      // know it's stored as base64 — small enough that Vercel's
      // serverless model is happy).
      storedAs: "base64",
    });
  } catch (e) {
    console.error("Upload logo error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
