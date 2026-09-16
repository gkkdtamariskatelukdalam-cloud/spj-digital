import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/products?q=search&category=ATK
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { spec: { contains: q } },
        { unit: { contains: q } },
      ];
    }
    if (category) where.category = category;
    const items = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET products error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/spj/products
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, spec, unit, price, category } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    const item = await db.product.create({
      data: {
        name,
        spec: spec ?? null,
        unit: unit ?? null,
        price: parseFloat(String(price || 0)),
        category: category || "ATK",
      },
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("POST product error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
