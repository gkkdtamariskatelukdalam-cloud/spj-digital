import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/vendors?q=search
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { owner: { contains: q } },
        { phone: { contains: q } },
        { address: { contains: q } },
      ];
    }
    const items = await db.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET vendors error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/spj/vendors
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, owner, phone, address } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    const item = await db.vendor.create({
      data: {
        name,
        owner: owner ?? null,
        phone: phone ?? null,
        address: address ?? null,
      },
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("POST vendor error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
