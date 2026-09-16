import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/bpu?q=search&isActive=true
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const isActive = url.searchParams.get("isActive");
    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { code: { contains: q } },
        { noPesan: { contains: q } },
      ];
    }
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;
    const items = await db.bpu.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET bpu error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/spj/bpu
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, noPesan, isActive } = body;
    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }
    // Ensure uniqueness
    const existing = await db.bpu.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "BPU code already exists" },
        { status: 409 }
      );
    }
    const item = await db.bpu.create({
      data: {
        code,
        noPesan: noPesan ?? null,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("POST bpu error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
