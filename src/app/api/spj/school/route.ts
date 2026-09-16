import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/school - returns the first school record
export async function GET() {
  try {
    const item = await db.school.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!item) {
      return NextResponse.json(
        { error: "School not configured" },
        { status: 404 }
      );
    }
    return NextResponse.json({ item });
  } catch (e) {
    console.error("GET school error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/spj/school - update school data (updates first record, or creates if missing)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const allowedFields = [
      "name",
      "npsn",
      "address",
      "principalName",
      "principalNip",
      "principalRank",
      "treasurerName",
      "treasurerNip",
      "treasurerRank",
      "goodsManagerName",
      "goodsManagerNip",
      "goodsManagerRank",
      "receiverName",
      "receiverPhone",
      "year",
    ];
    const updateData: Record<string, unknown> = {};
    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        if (f === "year") {
          updateData[f] = parseInt(String(body[f]));
        } else {
          updateData[f] = body[f];
        }
      }
    }

    const existing = await db.school.findFirst();
    let item;
    if (existing) {
      item = await db.school.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Create if not exists - require name
      if (!updateData.name) {
        return NextResponse.json(
          { error: "Name is required to create school record" },
          { status: 400 }
        );
      }
      item = await db.school.create({ data: updateData as never });
    }
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PUT school error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
