import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/spj/bpu/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await db.bpu.findUnique({
      where: { id },
    });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/spj/bpu/[id]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    const allowedFields = ["code", "noPesan"];
    for (const f of allowedFields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    const item = await db.bpu.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/spj/bpu/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.bpu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
