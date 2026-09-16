import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/documents?transactionId=xxx&type=PESAN
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const transactionId = url.searchParams.get("transactionId");
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (transactionId) where.transactionId = transactionId;
    if (type) where.type = type;
    if (status) where.status = status;
    const items = await db.document.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET documents error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/spj/documents - create a document record linked to a transaction
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      transactionId,
      type,
      docNumber,
      docDate,
      amount,
      filePath,
      status,
    } = body;
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }
    if (!type) {
      return NextResponse.json(
        { error: "type is required (PESAN, BANDING, RENCANA, SHP, BAT, SPJ)" },
        { status: 400 }
      );
    }
    // Verify transaction exists
    const tx = await db.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    const item = await db.document.create({
      data: {
        transactionId,
        type,
        docNumber: docNumber ?? null,
        docDate: docDate ?? null,
        amount: amount !== undefined ? parseFloat(String(amount)) : null,
        filePath: filePath ?? null,
        status: status || "generated",
      },
      include: {
        transaction: {
          select: {
            id: true,
            uraian: true,
            noBku: true,
            noPesan: true,
          },
        },
      },
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("POST document error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
