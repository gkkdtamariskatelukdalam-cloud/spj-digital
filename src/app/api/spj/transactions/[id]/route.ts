import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/spj/transactions/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { vendor: true, documents: true },
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ transaction });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/spj/transactions/[id]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "noUrut", "tglPesan", "noPesan", "tglBast", "noBast", "tglBayar",
      "noBku", "bpuCode", "uraian", "namaBarang", "volume", "satuan",
      "tarifHarga", "jumlah", "realisasi", "bulan", "tahun", "masukBku",
      "status", "vendorId",
    ];
    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        if (["noUrut", "bulan", "tahun"].includes(f)) {
          updateData[f] = body[f] ? parseInt(String(body[f])) : null;
        } else if (["volume", "tarifHarga", "jumlah", "realisasi"].includes(f)) {
          updateData[f] = parseFloat(String(body[f] || 0));
        } else {
          updateData[f] = body[f];
        }
      }
    }

    // Recompute jumlah if volume or tarif changes
    if (body.volume !== undefined || body.tarifHarga !== undefined) {
      const current = await db.transaction.findUnique({
        where: { id },
      });
      if (current) {
        const v = body.volume !== undefined ? parseFloat(body.volume) : current.volume;
        const t = body.tarifHarga !== undefined ? parseFloat(body.tarifHarga) : current.tarifHarga;
        if (body.jumlah === undefined) {
          updateData.jumlah = (v || 0) * (t || 0);
        }
        if (body.realisasi === undefined) {
          updateData.realisasi = (v || 0) * (t || 0);
        }
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: { vendor: true },
    });
    return NextResponse.json({ transaction });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/spj/transactions/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
