import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/spj/documents/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await db.document.findUnique({
      where: { id },
      include: {
        transaction: {
          select: {
            id: true,
            uraian: true,
            noBku: true,
            noPesan: true,
            jumlah: true,
            bulan: true,
            tahun: true,
          },
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

// PUT /api/spj/documents/[id]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    const allowedFields = ["type", "docNumber", "docDate", "filePath", "status"];
    for (const f of allowedFields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    if (body.amount !== undefined) {
      updateData.amount = parseFloat(String(body.amount || 0));
    }
    if (body.transactionId !== undefined) {
      updateData.transactionId = body.transactionId;
    }
    const item = await db.document.update({
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

// DELETE /api/spj/documents/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
