import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

// POST /api/spj/letterhead/upload-logo
// Accepts multipart form data with a file field "logo"
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, WebP, GIF are allowed" },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);
    
    // Ensure uploads directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    
    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    
    const logoPath = `/uploads/${filename}`;
    
    // Check if this is logo2 upload (via query param ?logo=2)
    const url = new URL(req.url);
    const isLogo2 = url.searchParams.get("logo") === "2";
    const pathField = isLogo2 ? "logo2Path" : "logoPath";
    
    // Update letterhead settings with new logo path
    const existing = await db.letterheadSettings.findFirst();
    if (existing) {
      // Delete old logo file if it's a custom upload (not the default)
      const oldLogoPath = isLogo2 ? existing.logo2Path : existing.logoPath;
      if (oldLogoPath && oldLogoPath.startsWith("/uploads/logo-") && oldLogoPath !== logoPath) {
        const oldPath = path.join(process.cwd(), "public", oldLogoPath);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      await db.letterheadSettings.update({
        where: { id: existing.id },
        data: { [pathField]: logoPath },
      });
    } else {
      await db.letterheadSettings.create({
        data: { [pathField]: logoPath },
      });
    }
    
    return NextResponse.json({ logoPath, size: file.size, isLogo2 });
  } catch (e) {
    console.error("Upload logo error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
