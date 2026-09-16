import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/spj/vendors/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await db.vendor.findUnique({
      where: { id },
      include: {
        transactions: {
          select: {
            id: true,
            uraian: true,
            jumlah: true,
            bulan: true,
            tahun: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
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

// PUT /api/spj/vendors/[id]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    const allowedFields = ["name", "owner", "phone", "address"];
    for (const f of allowedFields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    const item = await db.vendor.update({
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

// DELETE /api/spj/vendors/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    // Check if vendor has transactions before delete
    const txCount = await db.transaction.count({
      where: { vendorId: id },
    });
    if (txCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: vendor has ${txCount} transaction(s). Unlink or delete them first.`,
        },
        { status: 409 }
      );
    }
    await db.vendor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
