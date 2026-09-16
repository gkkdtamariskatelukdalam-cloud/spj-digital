import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/letterhead - returns the first letterhead settings (or defaults)
export async function GET() {
  try {
    let settings = await db.letterheadSettings.findFirst({
      orderBy: { createdAt: "asc" },
    });
    
    if (!settings) {
      // Create default settings if none exists
      settings = await db.letterheadSettings.create({
        data: {
          logoPath: "/uploads/logo-sman1.png",
        },
      });
    }
    
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("GET letterhead error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/spj/letterhead - update letterhead settings
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const allowedFields = [
      "logoPath", "logoWidth", "logoHeight", "logoOffsetX", "logoOffsetY",
      "fontFamily", "lineSpacing",
      "line1Text", "line1Bold", "line1Size",
      "line2Text", "line2Bold", "line2Size",
      "line3Text", "line3Bold", "line3Size",
      "line4Text", "line4Bold", "line4Size",
      "line5Text", "line5Bold", "line5Size",
      "line6Text", "line6Bold", "line6Size",
      "line7Text", "line7Bold", "line7Size",
      "showBottomLine", "bottomLineWidth",
    ];
    
    const updateData: Record<string, unknown> = {};
    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        if (typeof body[f] === "boolean") {
          updateData[f] = body[f];
        } else if (typeof body[f] === "number") {
          updateData[f] = body[f];
        } else if (typeof body[f] === "string") {
          updateData[f] = body[f];
        }
      }
    }
    
    const existing = await db.letterheadSettings.findFirst();
    let settings;
    if (existing) {
      settings = await db.letterheadSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      settings = await db.letterheadSettings.create({
        data: updateData as never,
      });
    }
    
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("PUT letterhead error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
