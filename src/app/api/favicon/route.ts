import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/favicon
// Returns the app logo as an image response (for browser favicon).
// If no logo is set, returns a 1x1 transparent PNG.
export async function GET() {
  try {
    const settings = await db.appSettings.findFirst();
    if (settings?.appLogo && settings.appLogo.startsWith("data:")) {
      // Parse data URL: data:image/png;base64,iVBOR...
      const match = settings.appLogo.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mimeType,
            // No cache — always fetch latest logo (so upload/delete
            // reflects immediately in browser favicon).
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }
    }
  } catch {
    // Fall through to default
  }

  // Default: 1x1 transparent PNG
  const transparentPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );
  return new NextResponse(transparentPng, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
